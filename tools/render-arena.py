"""Build and render SLAY's original championship arena with Blender.

Run: /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python tools/render-arena.py
The scene is intentionally saved before rendering so the arena remains editable.
"""
from pathlib import Path
import bpy
import math
import random
from mathutils import Vector

random.seed(18)
ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
ARTIFACTS = ROOT / "artifacts"
ASSETS.mkdir(parents=True, exist_ok=True)
ARTIFACTS.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def material(name, color, roughness=.5, metal=0, emission=None, strength=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metal
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1)
        bsdf.inputs["Emission Strength"].default_value = strength
    return mat


def cube(name, loc, scale, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        ob.data.materials.append(mat)
    if bevel:
        mod = ob.modifiers.new("Soft manufactured edges", "BEVEL")
        mod.width, mod.segments = bevel, 3
        ob.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
    return ob


primitive_cache = {}


def rod(name, a, b, radius, mat, vertices=16):
    delta = Vector(b) - Vector(a)
    key = ("cylinder", vertices, mat.name)
    if key not in primitive_cache:
        points = [(math.cos(i*math.tau/vertices), math.sin(i*math.tau/vertices), z)
                  for z in (-.5,.5) for i in range(vertices)]
        faces = [(i,(i+1)%vertices,(i+1)%vertices+vertices,i+vertices) for i in range(vertices)]
        faces += [tuple(range(vertices-1,-1,-1)), tuple(range(vertices,vertices*2))]
        mesh = bpy.data.meshes.new("Shared " + mat.name + " cylinder")
        mesh.from_pydata(points, [], faces)
        mesh.materials.append(mat)
        for poly in mesh.polygons[:vertices]:
            poly.use_smooth = True
        primitive_cache[key] = mesh
    ob = bpy.data.objects.new(name, primitive_cache[key])
    bpy.context.collection.objects.link(ob)
    ob.location = (Vector(a)+Vector(b))/2
    ob.scale = (radius,radius,delta.length)
    ob.rotation_euler = delta.to_track_quat("Z", "Y").to_euler()
    return ob


def sphere(name, loc, scale, mat, segments=16, rings=8):
    key = ("sphere", segments, rings, mat.name)
    if key not in primitive_cache:
        points = [(math.sin(j*math.pi/rings)*math.cos(i*math.tau/segments),
                   math.sin(j*math.pi/rings)*math.sin(i*math.tau/segments),
                   math.cos(j*math.pi/rings)) for j in range(rings+1) for i in range(segments)]
        faces = [(j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i)
                 for j in range(rings) for i in range(segments)]
        mesh = bpy.data.meshes.new("Shared " + mat.name + " sphere")
        mesh.from_pydata(points, [], faces)
        mesh.materials.append(mat)
        for poly in mesh.polygons:
            poly.use_smooth = True
        primitive_cache[key] = mesh
    ob = bpy.data.objects.new(name, primitive_cache[key])
    bpy.context.collection.objects.link(ob)
    ob.location = loc
    ob.scale = scale
    return ob


def text(name, body, loc, size, mat, rotation=(math.pi/2, 0, 0)):
    curve = bpy.data.curves.new(name, "FONT")
    curve.body = body
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.size = size
    curve.extrude = .007
    ob = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(ob)
    ob.location, ob.rotation_euler = loc, rotation
    ob.data.materials.append(mat)
    return ob


def light(name, loc, target, color, energy, kind="AREA", size=5, cone=.9):
    data = bpy.data.lights.new(name, type=kind)
    data.energy = energy
    data.color = color
    if kind == "AREA":
        data.shape, data.size = "DISK", size
    elif kind == "SPOT":
        data.spot_size, data.spot_blend, data.shadow_soft_size = cone, .5, .35
    ob = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(target)-ob.location).to_track_quat("-Z", "Y").to_euler()
    return ob


steel = material("Brushed gunmetal", (.065, .071, .079), .28, .85)
dark = material("Charcoal arena architecture", (.022, .024, .032), .7, .12)
black = material("Black leather ring apron", (.018, .019, .022), .43)
rope = material("Crimson vinyl ropes", (.58, .012, .024), .31, .1)
red_leather = material("Deep red corner cushions", (.32, .012, .02), .43)
canvas = material("Warm championship canvas", (.66, .65, .57), .92)
gold = material("Championship brass", (.57, .32, .085), .28, .72)
red_led = material("Ruby LED", (.30, .002, .007), .25, .1, (1, .008, .023), 5)
white_led = material("White spotlight aperture", (.6, .73, 1), .15, .05, (.75, .86, 1), 8)
label = material("Warm ivory lettering", (.68, .63, .52), .5, .1, (.52, .29, .13), .12)
mat_nodes = canvas.node_tree.nodes
noise = mat_nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 270
noise.inputs["Roughness"].default_value = .78
bump = mat_nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = .18
bump.inputs["Distance"].default_value = .015
canvas.node_tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
canvas.node_tree.links.new(bump.outputs["Normal"], mat_nodes.get("Principled BSDF").inputs["Normal"])

# Championship ring, with a raised padded canvas and heavily constructed apron.
cube("Arena floor", (0, 0, -.10), (45, 42, .20), dark)
cube("Ring base", (0, 0, .54), (8.5, 8.5, .92), black, .10)
cube("Canvas padded edge", (0, 0, 1.035), (8.38, 8.38, .16), canvas, .035)
cube("Canvas playing surface", (0, 0, 1.135), (8.15, 8.15, .07), canvas, .025)
for z in (.30, .86):
    for y in (-4.257, 4.257):
        cube("Apron stitched horizontal trim", (0, y, z), (8.2, .012, .026), red_leather, .008)
    for x in (-4.257, 4.257):
        cube("Apron stitched horizontal trim", (x, 0, z), (.012, 8.2, .026), red_leather, .008)
text("Front apron SLAY embroidery", "S L A Y", (0, -4.264, .58), .43, label)
text("Side apron SLAY embroidery", "S L A Y", (4.264, .0, .58), .43, label, (math.pi/2, 0, math.pi/2))
for x in (-4.25, 4.25):
    for y in (-4.25, 4.25):
        cube("Steel corner pedestal", (x, y, .35), (.53, .53, .60), steel, .06)
        cube("Black squared ring post", (x, y, 2.10), (.22, .22, 3.30), steel, .025)
        cube("Red corner post lower sleeve", (x, y, 1.10), (.245, .245, .90), red_leather, .025)
        sphere("Brass post finial", (x, y, 3.79), (.145, .145, .085), gold)
        for z in (1.79, 2.48, 3.17):
            inward = Vector((-math.copysign(.29, x), -math.copysign(.29, y), 0))
            center = Vector((x, y, z)) + inward
            pad = cube("Padded red turnbuckle", center, (.49, .21, .32), red_leather, .09)
            pad.rotation_euler.z = math.atan2(inward.y, inward.x) + math.pi/2
            rod("Steel corner rope tensioner", (x, y, z), center, .045, steel)
for z in (1.79, 2.48, 3.17):
    for side in (-1, 1):
        rod("Tensioned red rope", (-4.0, side*4.0, z), (4.0, side*4.0, z), .037, rope, 24)
        rod("Tensioned red rope", (side*4.0, -4.0, z), (side*4.0, 4.0, z), .037, rope, 24)
for i in range(3):
    cube("Ringside steel access step", (-4.9-i*.20, -3.25, .15+i*.17), (.98, 1.0, .29+i*.34), steel, .045)

# Subtle canvas emblem: small dark central logo, not distracting from the combatants.
ink = material("Canvas screen print", (.29, .26, .23), .95)
text("Canvas center emblem", "S L A Y", (0, .45, 1.176), .54, ink, (0, 0, 0))
text("Canvas center subtitle", "ORIGINAL CHAMPIONSHIP", (0, -.06, 1.176), .13, ink, (0, 0, 0))

# Ringside railings, photographer perimeter, and stadium seating.
for y in (-6.9, 7.3):
    for x in [i*.65 for i in range(-13, 14)]:
        rod("Crowd barrier vertical", (x,y,.10), (x,y,1.3), .027, steel, 8)
    for z in (.48, 1.28):
        rod("Crowd barrier rail", (-8.6,y,z), (8.6,y,z), .05, steel)
for x in (-7.25,7.25):
    for y in [i*.65 for i in range(-10,12)]:
        rod("Crowd barrier vertical", (x,y,.10), (x,y,1.3), .027, steel, 8)
    rod("Crowd barrier rail", (x,-6.8,1.28), (x,7.3,1.28), .05, steel)

crowd_mats = [material("Audience silhouette %02d" % i, col, .87) for i,col in enumerate([
    (.025,.023,.028),(.053,.028,.031),(.041,.047,.061),(.068,.051,.048),(.033,.032,.041),(.02,.033,.041)])]
skin_mats = [material("Distant audience skin %02d" % i, col, .9) for i,col in enumerate([
    (.15,.105,.075),(.10,.067,.049),(.21,.156,.117),(.081,.062,.05)])]
phone = material("Audience phone glimmer", (.10,.16,.25), .2, 0, (.35,.60,1), 3)

def audience_person(x,y,z):
    cm = random.choice(crowd_mats)
    sphere("Distant crowd torso", (x,y,z+.36), (.22,.16,.35), cm, 8, 4)
    sphere("Distant crowd head", (x,y,z+.82), (.13,.13,.16), random.choice(skin_mats), 8, 4)
    if random.random() < .026:
        cube("Spectator phone", (x+.18,y-.11,z+.74), (.047,.026,.086), phone)

for row in range(8):
    y = 8.0+row*.93
    z = .4+row*.52
    cube("Rear grandstand tier", (0,y,z-.25), (32,.88,.5), dark)
    cube("Rear grandstand LED strip", (0,y-.447,z-.06), (31,.016,.026), red_led)
    for seat in range(48):
        audience_person(-15.2+seat*.65+random.uniform(-.065,.065),y,z)
for side in (-1,1):
    for row in range(6):
        x = side*(8.1+row*.96)
        z = .4+row*.54
        cube("Side grandstand tier", (x,1.2,z-.25), (.88,14.6,.5), dark)
        cube("Side grandstand LED strip", (x-side*.448,1.2,z-.06), (.016,14.4,.026), red_led)
        for seat in range(23):
            audience_person(x,-5.6+seat*.63+random.uniform(-.06,.06),z)

# LED championship wall, side scoreboards, and a sparse industrial roof.
cube("Championship stage wall", (0,15.5,5.05), (13,.25,4.8), dark, .06)
cube("Stage ruby horizontal border", (0,15.32,7.1), (12,.04,.07), red_led)
cube("Stage ruby lower border", (0,15.32,3.13), (12,.04,.04), red_led)
text("Championship wall wordmark", "S L A Y", (0,15.28,5.45), 1.15, red_led)
text("Championship wall subtitle", "ORIGINAL CHAMPIONSHIP", (0,15.26,4.49), .25, label)
for x in (-11.5,11.5):
    cube("Arena flank screen", (x,14.5,5.7), (4.7,.2,2.4), black, .08)
    text("Flank screen division", "THE MAIN EVENT", (x,14.37,6.03), .22, label)
    text("Flank screen ornament", "//  SLAY  //", (x,14.35,5.36), .42, red_led)
for x in (-9, 9):
    for z in (8.0,8.55):
        rod("Long overhead truss chord", (x,-2,z), (x,17,z), .07, steel)
    for i in range(19):
        y = -2+i
        rod("Overhead truss diagonal", (x,y,8.0), (x,y+1,8.55), .035, steel, 8)
        rod("Overhead truss diagonal", (x,y,8.55), (x,y+1,8.0), .035, steel, 8)
for y in (-4.8,4.8):
    for z in (8.0,8.55):
        rod("Ring transverse truss chord", (-9,y,z), (9,y,z), .055, steel)
    for i in range(18):
        x = -9+i
        rod("Transverse truss brace", (x,y,8.0), (x+1,y,8.55), .03, steel, 8)

# Visible fixtures provide material highlights, while actual spots light the canvas.
for x in (-6.7,-3.6,3.6,6.7):
    for y in (-4.8,4.8):
        fixture = rod("Theatrical spotlight housing", (x,y,8.08), (x*.93,y*.93,7.73), .16, steel)
        sphere("White spotlight lens", (x*.93,y*.93,7.72), (.13,.13,.045), white_led)
        light("White championship spotlight", (x*.93,y*.93,7.65), (x*.26,y*.20,1), (.72,.81,1), 850, "SPOT", cone=.8)
for x in (-10,10):
    for y in (1,8,14):
        light("Crimson crowd wash", (x,y,7.0), (x*.45,y,1.2), (1,.014,.029), 800, "SPOT", cone=1.2)
        sphere("Red wash lens", (x,y,7), (.14,.14,.09), red_led)
light("Large soft ring key", (1,-1,8.4), (0,0,1), (.95,.89,.76), 2200, size=6)
light("Ring left edge fill", (-6,-3,5.2), (0,0,1.5), (.25,.40,.70), 650, size=5)
light("Warm camera fill", (7,-10,6), (0,0,1.5), (1,.63,.43), 650, size=5)
light("Red stage atmosphere", (0,11,5), (0,1,3), (1,.01,.028), 750, size=6)

# Thin stadium haze catches the beams without washing out the ring.
haze = bpy.data.materials.new("Atmospheric stadium haze")
haze.use_nodes = True
haze.node_tree.nodes.clear()
out = haze.node_tree.nodes.new("ShaderNodeOutputMaterial")
volume = haze.node_tree.nodes.new("ShaderNodeVolumePrincipled")
volume.inputs["Density"].default_value = .007
volume.inputs["Color"].default_value = (.18,.21,.27,1)
volume.inputs["Anisotropy"].default_value = .28
haze.node_tree.links.new(volume.outputs["Volume"],out.inputs["Volume"])
cube("Stadium haze enclosure", (0,3,5), (38,36,12), haze)

bpy.ops.object.camera_add(location=(12.7,-17.6,10.45))
camera = bpy.context.object
camera.name = "Main event cinematic camera"
target = Vector((0,1.4,2.45))
camera.rotation_euler = (target-camera.location).to_track_quat("-Z","Y").to_euler()
camera.data.lens = 41
camera.data.sensor_width = 36
camera.data.dof.use_dof = True
camera.data.dof.focus_distance = (camera.location-Vector((0,0,1.6))).length
camera.data.dof.aperture_fstop = 3.5
scene = bpy.context.scene
scene.camera = camera
scene.render.engine = "CYCLES"
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 6
scene.cycles.volume_bounces = 0
scene.render.resolution_x = 1600
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.world.use_nodes = True
scene.world.node_tree.nodes.get("Background").inputs["Color"].default_value = (.006,.008,.014,1)
scene.world.node_tree.nodes.get("Background").inputs["Strength"].default_value = .30
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.filepath = str(ASSETS / "arena.png")
print("SLAY scene construction complete; saving editable arena.", flush=True)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(ARTIFACTS / "arena.blend"))
bpy.ops.render.render(write_still=True)
print("SLAY arena render saved:", scene.render.filepath)
