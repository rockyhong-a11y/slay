"""Register anatomical guides against source alpha; never modify image pixels."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public/assets/classic-actions'
manifest = json.loads((ASSETS / 'manifest.json').read_text())
# Crop-normalized anatomical guides, ordered head/neck, shoulders, elbows,
# wrists, hips, knees, ankles. Reviewed against the five new source sheets.
GUIDES = {
 'ready': [[.61,.16],[.59,.27],[.46,.30],[.72,.29],[.36,.40],[.82,.35],[.46,.31],[.82,.27],[.49,.50],[.63,.50],[.32,.69],[.77,.68],[.11,.91],[.85,.92]],
 'windup': [[.75,.16],[.73,.25],[.54,.22],[.81,.30],[.43,.16],[.87,.36],[.59,.24],[.91,.40],[.48,.49],[.69,.51],[.28,.67],[.85,.69],[.12,.91],[.88,.91]],
 'elbow': [[.64,.15],[.62,.25],[.47,.23],[.69,.25],[.82,.24],[.40,.32],[.95,.25],[.46,.36],[.41,.51],[.57,.54],[.24,.72],[.80,.70],[.10,.94],[.91,.94]],
 'kick': [[.22,.14],[.24,.24],[.15,.27],[.33,.26],[.09,.40],[.40,.25],[.16,.33],[.50,.22],[.27,.44],[.42,.39],[.27,.64],[.65,.22],[.26,.92],[.92,.11]],
 'clinch': [[.62,.14],[.59,.27],[.43,.23],[.66,.28],[.46,.39],[.83,.33],[.74,.45],[.93,.34],[.37,.45],[.57,.47],[.22,.66],[.70,.62],[.10,.90],[.71,.86]],
 'lift': [[.61,.31],[.60,.41],[.44,.42],[.73,.39],[.42,.23],[.74,.23],[.42,.05],[.72,.08],[.48,.60],[.62,.60],[.31,.75],[.82,.76],[.12,.94],[.92,.94]],
 'slam': [[.50,.21],[.52,.34],[.37,.31],[.62,.31],[.41,.56],[.60,.57],[.48,.85],[.55,.85],[.40,.67],[.59,.69],[.22,.72],[.79,.71],[.09,.80],[.91,.82]],
 'suplex': [[.29,.65],[.23,.58],[.15,.57],[.40,.60],[.10,.76],[.32,.77],[.20,.82],[.39,.84],[.45,.17],[.59,.18],[.75,.33],[.79,.48],[.79,.87],[.95,.87]],
 'armbar': [[.26,.21],[.30,.32],[.17,.34],[.40,.30],[.23,.55],[.43,.49],[.47,.55],[.49,.58],[.21,.75],[.36,.75],[.31,.49],[.71,.82],[.45,.77],[.90,.89]],
 'leglock': [[.32,.20],[.34,.33],[.15,.39],[.40,.34],[.15,.52],[.36,.51],[.29,.58],[.31,.60],[.25,.75],[.39,.73],[.28,.55],[.73,.82],[.33,.91],[.94,.92]],
 'guard': [[.45,.17],[.45,.27],[.28,.30],[.58,.29],[.26,.40],[.68,.34],[.45,.34],[.62,.14],[.39,.52],[.59,.50],[.24,.70],[.76,.68],[.11,.93],[.88,.94]],
 'hurt': [[.24,.14],[.34,.28],[.19,.29],[.49,.27],[.24,.45],[.70,.32],[.08,.46],[.92,.25],[.56,.48],[.69,.50],[.62,.70],[.84,.67],[.45,.91],[.92,.90]],
}
# In these authored bridges the inverted head is on the right of the pelvis.
RIGHT_BRIDGE = [[.71,.70],[.64,.55],[.58,.43],[.77,.43],[.72,.61],[.94,.67],[.83,.88],[.91,.87],[.40,.18],[.56,.16],[.20,.32],[.78,.31],[.10,.87],[.78,.82]]
OVERRIDES = {
 'lynx': {'suplex': RIGHT_BRIDGE},
 'onyx': {'suplex': RIGHT_BRIDGE, 'slam': {0:[.48,.42],1:[.51,.51],2:[.37,.49],3:[.62,.48]}},
 'seraph': {'suplex': {0:[.40,.60],1:[.34,.54],2:[.25,.48],3:[.43,.54],4:[.31,.63],5:[.37,.73],6:[.37,.69],7:[.40,.77]}},
}
output = {}
for actor in ['atlas','seraph','lynx','tempest','onyx']:
 alpha = Image.open(ASSETS / f'{actor}.png').getchannel('A')
 eroded = np.asarray(alpha.filter(ImageFilter.MinFilter(5))) > 180
 output[actor] = {}
 for pose, frame in manifest[actor]['frames'].items():
  x,y,w,h = (frame[k] for k in ['x','y','width','height'])
  guide = [p[:] for p in GUIDES[pose]]
  override = OVERRIDES.get(actor, {}).get(pose, {})
  if isinstance(override,list): guide = override
  else:
   for index, point in override.items(): guide[index] = point
  ys,xs = np.where(eroded[y:y+h,x:x+w])
  # Restrict to this pose's measured polygon if neighboring poses share a box.
  clip = frame['clip']
  inside = np.zeros(xs.shape, dtype=bool)
  px,py = (xs+.5)*100/w,(ys+.5)*100/h
  for i,(ax,ay) in enumerate(clip):
   bx,by=clip[(i+1)%len(clip)]
   if ay != by:
    inside ^= ((ay>py)!=(by>py)) & (px < (bx-ax)*(py-ay)/(by-ay)+ax)
  xs,ys=xs[inside],ys[inside]
  registered=[]
  for gx,gy in guide:
   index=int(np.argmin((xs+.5-gx*w)**2+(ys+.5-gy*h)**2))
   registered.append([round((float(xs[index])+.5)/w,6),round((float(ys[index])+.5)/h,6)])
  assert len({tuple(p) for p in registered})==14,(actor,pose)
  output[actor][pose]=registered
(ROOT / 'src/newcomer-landmarks.js').write_text('// Authored whole-pose landmarks. Reproduce with tools/register-newcomer-actions.py.\nexport const NEWCOMER_ACTION_LANDMARKS = '+json.dumps(output,indent=2)+';\n')
print('Registered 60 newcomer poses, 840 anatomical anchors inside their own source silhouettes.')
