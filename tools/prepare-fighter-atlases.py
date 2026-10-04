"""Export generated originals and measured six-part rigs. No image painting or segmentation edits.

Requires Pillow. Paths of generated originals are recorded in the exact prompt sets.
Overlapping atlas rectangles use runtime clip metadata; source pixels remain unchanged.
"""
import json
import shutil
from collections import deque
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/assets/fighters'
SOURCES = ROOT / 'artifacts/fighter-sources'
DEST.mkdir(parents=True, exist_ok=True)
SOURCES.mkdir(parents=True, exist_ok=True)

# Final canvas coordinates, measured against the illustrated joints and face openings.
LAYOUT = {
    'raven': {
        'body': [.145,.19,.71,.79], 'head': [.408,.025,.184,.187],
        'backHair': [.264,.006,.472,.399], 'frontHair': [.244,.005,.45,.312],
        'leftArm': [.202,.212,.247,.308], 'rightArm': [.565,.212,.248,.308],
        'eyes': [[727,277,20,9],[828,277,20,9]], 'mouth': [777,351,34,11],
        'skin': '#f7b899', 'iris': '#8fa1b0',
    },
    'valkyrie': {
        'body': [.165,.19,.67,.79], 'head': [.399,.012,.202,.198],
        'backHair': [.324,.004,.352,.21], 'frontHair': [.337,.003,.338,.206],
        'leftArm': [.145,.208,.322,.292], 'rightArm': [.553,.208,.307,.301],
        'eyes': [[714,257,23,10],[829,235,24,10]], 'mouth': [784,340,32,11],
        'skin': '#f9bda3', 'iris': '#59bee6',
    },
    'nova': {
        'body': [.202,.19,.596,.79], 'head': [.409,.028,.183,.179],
        'backHair': [.282,.003,.438,.453], 'frontHair': [.32,.002,.356,.297],
        'leftArm': [.158,.206,.3,.235], 'rightArm': [.548,.207,.305,.307],
        'eyes': [[721,264,19,9],[813,260,19,9]], 'mouth': [768,344,44,16],
        'skin': '#f4b093', 'iris': '#98592e',
    },
    'viper': {
        'body': [.155,.185,.69,.795], 'head': [.399,.025,.202,.177],
        'backHair': [.27,.005,.459,.446], 'frontHair': [.309,.005,.369,.266],
        'leftArm': [.189,.205,.249,.327], 'rightArm': [.567,.205,.264,.327],
        'eyes': [[728,274,20,9],[832,291,20,9]], 'mouth': [779,358,51,16],
        'skin': '#f7b698', 'iris': '#65bce5',
    },
    'ember': {
        'body': [.159,.19,.682,.79], 'head': [.405,.029,.19,.18],
        'backHair': [.282,.002,.436,.327], 'frontHair': [.291,.003,.412,.263],
        'leftArm': [.176,.212,.282,.349], 'rightArm': [.552,.212,.33,.337],
        'eyes': [[719,229,21,10],[813,216,21,10]], 'mouth': [775,299,72,24],
        'skin': '#efa069', 'iris': '#84502f',
    },
}
PARTS = ['body','head','backHair','frontHair','leftArm','rightArm']

def classify(box):
    x,y,x1,y1 = box
    column = int(((x+x1)/2)/512)
    if column == 1: return 'head' if y < 500 else 'leftArm'
    if column == 2: return 'backHair' if y < 500 else 'rightArm'
    return 'body' if y < 500 else 'frontHair'

def local_clips(image, box, other_boxes):
    """Find runtime rectangles for a bbox which also contains a neighboring part.

    Alpha connected component is only used to measure coordinates; pixels never change.
    """
    x0,y0,x1,y1 = box
    intersections = [(max(y0,b[1]),min(y1,b[3])) for b in other_boxes
                     if max(x0,b[0]) < min(x1,b[2]) and max(y0,b[1]) < min(y1,b[3])]
    if not intersections: return None
    alpha = image.getchannel('A'); W,H = image.size
    pixels = alpha.tobytes()
    # Start in the opaque interior of this part, away from overlap rows.
    seed = next(y*W+x for y in range(y0,y1) for x in range(x0,x1)
                if pixels[y*W+x] >= 128 and not any(a<=y<b for a,b in intersections))
    visited = bytearray(W*H)
    queue = deque([seed]); visited[seed] = 1
    while queue:
        p = queue.popleft(); x,y = p%W,p//W
        for q in ([p-1] if x else []) + ([p+1] if x+1<W else []) + ([p-W] if y else []) + ([p+W] if y+1<H else []):
            if not visited[q] and pixels[q] >= 32:
                visited[q]=1; queue.append(q)
    rects=[]; safe_start=y0
    for y in range(y0,y1):
        unsafe = any(a<=y<b for a,b in intersections)
        if not unsafe: continue
        if safe_start<y: rects.append([x0,safe_start,x1-x0,y-safe_start])
        safe_start=y+1
        x=x0
        while x<x1:
            if not visited[y*W+x]: x+=1; continue
            start=x
            while x<x1 and visited[y*W+x]: x+=1
            left=max(x0,start-1);right=min(x1,x+1)
            rects.append([left,y,right-left,1])
    if safe_start<y1: rects.append([x0,safe_start,x1-x0,y1-safe_start])
    return [[round((x-x0)/(x1-x0),7),round((y-y0)/(y1-y0),7),round(w/(x1-x0),7),round(h/(y1-y0),7)] for x,y,w,h in rects]

components=json.loads((ROOT/'artifacts/cartoon-atlas-components.json').read_text())
manifest={'version':1,'renderer':'six-part hierarchical 2D puppet','fighters':{}}
atlas_prompts=json.loads((ROOT/'artifacts/cartoon-puppet-prompts.json').read_text())['atlases']
base_prompts=json.loads((ROOT/'artifacts/cartoon-fighter-prompts.json').read_text())['bases']
for record in base_prompts:
    actor=record['id']; original=Path(record['output'])
    shutil.copyfile(original,SOURCES/f'{actor}-base.png')
    image=Image.open(original).convert('RGBA');image.thumbnail((1000,1500),Image.Resampling.LANCZOS)
    image.save(DEST/f'{actor}.webp',quality=92,method=6)
for record in atlas_prompts:
    actor=record['id'];original=Path(record['output'])
    shutil.copyfile(original,SOURCES/f'{actor}-atlas.png')
    image=Image.open(original).convert('RGBA'); W,H=image.size
    image.save(DEST/f'{actor}-atlas.webp',quality=93,method=6)
    boxes={classify(c['box']): [max(0,c['box'][0]-2),max(0,c['box'][1]-2),min(W,c['box'][2]+2),min(H,c['box'][3]+2)] for c in components[actor]}
    cfg={'base':f'fighters/{actor}.webp','atlas':f'fighters/{actor}-atlas.webp','size':[1000,1500],'facing':1,'parts':[]}
    for part_id in PARTS:
        x,y,x1,y1=boxes[part_id]
        pivot={'body':[.5,1],'head':[.5,.98],'backHair':[.5,.15],'frontHair':[.5,.18],'leftArm':[.86,.055],'rightArm':[.12,.055]}[part_id]
        part={'id':part_id,'source':[x/W,y/H,(x1-x)/W,(y1-y)/H],'bounds':LAYOUT[actor][part_id],'pivot':pivot,
              'parent': None if part_id=='body' else ('head' if part_id in ['backHair','frontHair'] else 'body'),
              'z':{'backHair':0,'body':10,'leftArm':5,'rightArm':5,'head':30,'frontHair':40}[part_id]}
        clip=local_clips(image,boxes[part_id],[b for key,b in boxes.items() if key!=part_id])
        if clip: part['sourceClip']=clip
        cfg['parts'].append(part)
    hx,hy,hx1,hy1=boxes['head'];dx,dy,dw,dh=LAYOUT[actor]['head']
    def face_point(values):
        x,y,w,h=values
        return [dx+(x-hx)/(hx1-hx)*dw,dy+(y-hy)/(hy1-hy)*dh,w/(hx1-hx)*dw,h/(hy1-hy)*dh]
    cfg['face']={'eyes':[face_point(p) for p in LAYOUT[actor]['eyes']], 'mouth':face_point(LAYOUT[actor]['mouth']),
                 'skin':LAYOUT[actor]['skin'],'iris':LAYOUT[actor]['iris']}
    manifest['fighters'][actor]=cfg
    print(actor, 'six parts', 'runtime clips', sum(len(p.get('sourceClip',[])) for p in cfg['parts']))
(DEST/'puppet-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
