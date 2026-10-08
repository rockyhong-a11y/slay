"""Read source alpha only; write metadata, never rewrite or composite image pixels."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'public/assets/classic-actions'
ACTORS = ['raven', 'valkyrie', 'nova', 'viper', 'ember']
POSES = ['ready', 'windup', 'elbow', 'kick', 'clinch', 'lift', 'slam', 'suplex', 'armbar', 'leglock', 'guard', 'hurt']

def components(alpha):
    parent, rows, previous = [], [], []
    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    for y, row in enumerate(alpha > 150):
        transitions = np.diff(np.r_[False, row, False].astype('int8'))
        current = []
        for left, right in zip(np.where(transitions == 1)[0], np.where(transitions == -1)[0]):
            index = len(parent)
            parent.append(index)
            rows.append((int(left), y, int(right)))
            for pl, pr, pi in previous:
                if pr >= left and pl <= right:
                    parent[find(pi)] = index
            current.append((left, right, index))
        previous = current
    groups = {}
    for i, span in enumerate(rows):
        groups.setdefault(find(i), []).append(span)
    return [g for g in groups.values() if sum(r-l for l,y,r in g) > 6000]

def inside(poly, xs, ys):
    result = np.zeros(xs.shape, dtype=bool)
    for i, (x1, y1) in enumerate(poly):
        x2, y2 = poly[(i+1) % len(poly)]
        if y1 == y2:
            continue
        crossing = ((y1 > ys) != (y2 > ys)) & (xs < (x2-x1)*(ys-y1)/(y2-y1)+x1)
        result ^= crossing
    return result

def simplify(points, tolerance=0.7):
    if len(points)<3:
        return points
    a,b=np.array(points[0],dtype=float),np.array(points[-1],dtype=float)
    v=b-a
    data=np.array(points[1:-1],dtype=float)-a
    if np.dot(v,v)==0:
        distances=np.linalg.norm(data,axis=1)
    else:
        t=np.clip(data@v/np.dot(v,v),0,1)
        distances=np.linalg.norm(data-t[:,None]*v,axis=1)
    i=int(np.argmax(distances))+1
    if distances[i-1] <= tolerance:
        return [points[0],points[-1]]
    return simplify(points[:i+1],tolerance)[:-1]+simplify(points[i:],tolerance)

def outline_rows(group, left, top, right, bottom):
    mask=np.zeros((bottom-top,right-left),dtype='uint8')
    for l,y,r in group:
        mask[y-top,l-left:r-left]=255
    mask=np.asarray(Image.fromarray(mask).filter(ImageFilter.MaxFilter(5)))>0
    padded=np.pad(mask,1)
    edges={}
    directions=[(0,-1),(1,0),(0,1),(-1,0)]
    for direction,(dx,dy) in enumerate(directions):
        exposed=mask & ~padded[1+dy:1+dy+mask.shape[0],1+dx:1+dx+mask.shape[1]]
        for yy,xx in zip(*np.where(exposed)):
            x,y=int(xx)+left,int(yy)+top
            a,b=[((x,y),(x+1,y)),((x+1,y),(x+1,y+1)),((x+1,y+1),(x,y+1)),((x,y+1),(x,y))][direction]
            edges.setdefault(a,[]).append(b)
    loops=[]
    while edges:
        start=next(iter(edges)); point=start; loop=[]
        while True:
            loop.append(point)
            neighbors=edges[point]
            end=neighbors.pop()
            if not neighbors: del edges[point]
            point=end
            if point==start: break
        loops.append(loop)
    polygon=max(loops,key=len)
    half=len(polygon)//2
    return simplify(polygon[:half+1])[:-1]+simplify(polygon[half:]+[polygon[0]])[:-1]

manifest, records = {}, {}
for actor in ACTORS:
    path = ASSETS / f'{actor}.png'
    image = Image.open(path)
    alpha = np.asarray(image)[:, :, 3]
    width, height = image.size
    groups = components(alpha)
    assert len(groups) == 12, (actor, len(groups))
    groups.sort(key=lambda g: min(y for l,y,r in g))
    groups = sum([sorted(groups[i:i+3], key=lambda g: min(l for l,y,r in g)) for i in range(0,12,3)], [])
    frames, evidence = {}, {}
    for pose, group in zip(POSES, groups):
        ink = [min(l for l,y,r in group), min(y for l,y,r in group), max(r for l,y,r in group), max(y+1 for l,y,r in group)]
        left, top = max(0,ink[0]-3), max(0,ink[1]-3)
        right, bottom = min(width,ink[2]+3), min(height,ink[3]+3)
        other_points = np.array([(x,y) for other in groups if other is not group for l,y,r in other if top<=y<bottom for x in range(max(left,l),min(right,r))])
        polygon = outline_rows(group,left,top,right,bottom) if len(other_points) else [(left,top),(right,top),(right,bottom),(left,bottom)]
        clip = [[round((x-left)*100/(right-left),6),round((y-top)*100/(bottom-top),6)] for x,y in polygon]
        frames[pose] = {'x':left,'y':top,'width':right-left,'height':bottom-top,'clip':clip}
        own_points = np.array([(l+0.5,y+0.5) for l,y,r in group]+[(r-0.5,y+0.5) for l,y,r in group])
        assert inside(polygon,own_points[:,0],own_points[:,1]).all(), (actor,pose,'cut ink')
        neighbor_ink = int(inside(polygon,other_points[:,0]+0.5,other_points[:,1]+0.5).sum()) if len(other_points) else 0
        assert neighbor_ink == 0, (actor,pose,'neighbor bleed',neighbor_ink)
        evidence[pose] = {'inkBounds':ink,'inkPixels':sum(r-l for l,y,r in group),'clipContainsWholePose':True,'neighborInkPixels':neighbor_ink}
    manifest[actor] = {'width':width,'height':height,'referenceHeight':frames['ready']['height'],'frames':frames}
    records[actor] = {'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'width':width,'height':height,'alphaThreshold':150,'frames':evidence}
(ASSETS / 'manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
(ROOT / 'artifacts/classic-actions/alpha-qa.json').write_text(json.dumps(records,indent=2)+'\n')
print('Measured 60 complete source poses; no neighboring character ink inside any clip polygon.')
