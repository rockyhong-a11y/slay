"""Build a Blender QA gallery of complete 2D illustrations on single planes.

Run with Blender's Python interpreter:
  Blender -b --factory-startup --python tools/build-state-gallery.py -- --check
  Blender -b --factory-startup --python tools/build-state-gallery.py

The gallery is not a 3D character model, character rig, or animation. It never
segments, repaints, scales body parts, or otherwise changes an illustration.
"""

import hashlib
import json
from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets" / "fighters" / "states"
OUTPUT = ROOT / "artifacts"
ACTORS = ("raven", "valkyrie", "nova", "viper", "ember", "atlas", "seraph", "lynx", "tempest", "onyx")
STATES = ("normal", "excited", "fiery", "frustrated", "tired", "groggy")
BLEND = OUTPUT / "expanded-fighter-state-gallery.blend"
RENDER = OUTPUT / "expanded-fighter-state-gallery.jpg"
FACTS = OUTPUT / "expanded-fighter-state-gallery-facts.json"
PLANE_WIDTH, PLANE_HEIGHT = 2.0, 3.0
COLUMN_GAP, ROW_GAP = 0.32, 0.55
LEFT_GUTTER, RIGHT_MARGIN = 1.15, 0.5
TOP_MARGIN, BOTTOM_MARGIN = 1.65, 0.55


def source_paths():
    return [
        (actor, state, ASSETS / f"{actor}-{state}.webp")
        for actor in ACTORS
        for state in STATES
    ]


def load_whole_image(path):
    """Keep exactly the source WebP bytes packed in the editable .blend."""
    image = bpy.data.images.load(str(path), check_existing=False)
    if tuple(image.size) != (1000, 1500) or image.channels != 4:
        raise ValueError(f"Expected 1000x1500 RGBA whole image: {path.name}")
    image.alpha_mode = "STRAIGHT"
    image.colorspace_settings.name = "sRGB"
    source = path.read_bytes()
    image.pack(data=source, data_len=len(source))
    packed = bytes(image.packed_file.data)
    if packed != source:
        raise ValueError(f"Packed source bytes changed: {path.name}")
    return image, {
        "source": str(path.relative_to(ROOT)),
        "dimensions": list(image.size),
        "channels": image.channels,
        "source_bytes": len(source),
        "packed_bytes": len(packed),
        "source_sha256": hashlib.sha256(source).hexdigest(),
        "packed_source_unchanged": True,
        "format": "WebP",
    }


def check_available():
    checks = []
    for actor, state, path in source_paths():
        if not path.is_file():
            continue
        image, facts = load_whole_image(path)
        checks.append({"actor": actor, "state": state, **facts})
        bpy.data.images.remove(image)
    print(json.dumps({"mode": "check_only", "available": len(checks), "required": len(ACTORS) * len(STATES), "images": checks}, indent=2))


def emission_material(name, color):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = (*color, 1)
    emission.inputs["Strength"].default_value = 1
    output = nodes.new("ShaderNodeOutputMaterial")
    material.node_tree.links.new(emission.outputs[0], output.inputs["Surface"])
    return material


def image_material(image):
    material = bpy.data.materials.new("Whole image / " + image.name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Linear"
    texture.extension = "CLIP"
    transparent = nodes.new("ShaderNodeBsdfTransparent")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Strength"].default_value = 1
    mix = nodes.new("ShaderNodeMixShader")
    output = nodes.new("ShaderNodeOutputMaterial")
    links = material.node_tree.links
    links.new(texture.outputs["Color"], emission.inputs["Color"])
    links.new(texture.outputs["Alpha"], mix.inputs[0])
    links.new(transparent.outputs[0], mix.inputs[1])
    links.new(emission.outputs[0], mix.inputs[2])
    links.new(mix.outputs[0], output.inputs["Surface"])
    return material


def whole_image_plane(name, image, x, y):
    # Four vertices, one face, one material, one complete texture; no modifiers.
    mesh = bpy.data.meshes.new(name + " / four vertex plane")
    mesh.from_pydata(
        [(-1, -1.5, 0), (1, -1.5, 0), (1, 1.5, 0), (-1, 1.5, 0)],
        [],
        [(0, 1, 2, 3)],
    )
    mesh.update()
    uv = mesh.uv_layers.new(name="Whole image UV")
    for loop, coordinate in zip(mesh.polygons[0].loop_indices, ((0, 0), (1, 0), (1, 1), (0, 1))):
        uv.data[loop].uv = coordinate
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = (x, y, 0)
    obj.data.materials.append(image_material(image))
    obj["asset_role"] = "single plane displaying one complete 2D illustration"
    obj["source_image"] = image.name
    return obj


def caption(text, x, y, size, material, align="LEFT"):
    curve = bpy.data.curves.new("Caption / " + text, "FONT")
    curve.body = text
    curve.size = size
    curve.align_x = align
    curve.align_y = "CENTER"
    curve.space_character = 1.1
    obj = bpy.data.objects.new(curve.name, curve)
    bpy.context.collection.objects.link(obj)
    obj.location = (x, y, 0.03)
    obj.data.materials.append(material)
    return obj


def scene_facts(objects, source_facts, scene):
    inventory = {kind: sum(obj.type == kind for obj in scene.objects) for kind in ("MESH", "ARMATURE", "FONT", "CAMERA", "LIGHT", "EMPTY")}
    inventory_all = {kind: sum(obj.type == kind for obj in scene.objects) for kind in sorted({obj.type for obj in scene.objects})}
    owners = []
    for collection in (bpy.data.objects, bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights, bpy.data.worlds, bpy.data.scenes, bpy.data.node_groups, bpy.data.images):
        owners.extend(collection)
    owners.extend(data.node_tree for data in list(bpy.data.materials) + list(bpy.data.worlds) if data.node_tree)
    animated_owners = [data.name for data in owners if getattr(data, "animation_data", None)]
    planes = []
    for obj, source in zip(objects, source_facts):
        textures = [node.image for material in obj.data.materials for node in material.node_tree.nodes if node.type == "TEX_IMAGE"]
        planes.append({
            "name": obj.name,
            "actor": obj["actor"],
            "state": obj["state"],
            "vertices": len(obj.data.vertices),
            "faces": len(obj.data.polygons),
            "dimensions": [round(value, 8) for value in obj.dimensions],
            "location": list(obj.location),
            "rotation_euler": list(obj.rotation_euler),
            "scale": list(obj.scale),
            "parent": obj.parent.name if obj.parent else None,
            "modifiers": len(obj.modifiers),
            "constraints": len(obj.constraints),
            "animation_data": bool(obj.animation_data),
            "texture_nodes": len(textures),
            "assigned_texture_names": [image.name for image in textures],
            "assigned_texture_sha256": [hashlib.sha256(bytes(image.packed_file.data)).hexdigest() if image.packed_file else None for image in textures],
            "world_bounds": [list(obj.matrix_world @ vertex.co) for vertex in obj.data.vertices],
            "whole_image_uv": [list(item.uv) for item in obj.data.uv_layers.active.data],
            **source,
        })
    frame = [scene.camera.matrix_world @ corner for corner in scene.camera.data.view_frame(scene=scene)]
    camera_bounds = {
        "left": min(point.x for point in frame),
        "right": max(point.x for point in frame),
        "bottom": min(point.y for point in frame),
        "top": max(point.y for point in frame),
    }
    checks = {
        "complete_single_image_planes": inventory["MESH"] == len(ACTORS) * len(STATES) and len(planes) == len(ACTORS) * len(STATES) and len(bpy.data.meshes) == len(ACTORS) * len(STATES),
        "four_vertices_one_face_per_image": all(item["vertices"] == 4 and item["faces"] == 1 for item in planes),
        "one_complete_texture_per_plane": all(item["texture_nodes"] == 1 for item in planes),
        "assigned_texture_is_exact_reported_source": all(item["assigned_texture_sha256"] == [item["source_sha256"]] and item["assigned_texture_names"] == [f'{item["actor"]}-{item["state"]}.webp'] for item in planes),
        "full_image_uv_mapping": all(item["whole_image_uv"] == [[0, 0], [1, 0], [1, 1], [0, 1]] for item in planes),
        "identical_scale_orientation_and_dimensions": len({tuple(item["scale"] + item["rotation_euler"] + item["dimensions"]) for item in planes}) == 1,
        "no_armatures": inventory["ARMATURE"] == 0,
        "no_actions": len(bpy.data.actions) == 0,
        "no_animation_or_drivers_anywhere": not animated_owners,
        "only_image_planes_font_captions_and_camera": set(inventory_all).issubset({"MESH", "FONT", "CAMERA"}) and inventory["FONT"] == 2 + len(STATES) + len(ACTORS) * (2 + len(STATES)) and inventory["CAMERA"] == 1,
        "no_animation_modifiers_constraints_or_parents": all(not item["animation_data"] and not item["modifiers"] and not item["constraints"] and item["parent"] is None for item in planes),
        "exact_source_files_packed": all(item["packed_source_unchanged"] for item in planes),
        "all_complete_planes_inside_camera": all(
            camera_bounds["left"] - 0.001 <= point[0] <= camera_bounds["right"] + 0.001
            and camera_bounds["bottom"] - 0.001 <= point[1] <= camera_bounds["top"] + 0.001
            for item in planes for point in item["world_bounds"]
        ),
    }
    if not all(checks.values()):
        raise RuntimeError("Gallery baseline facts failed: " + repr(checks))
    return {
        "purpose": "QA comparison gallery of complete 2D state illustrations on image planes",
        "is_3d_character_model": False,
        "is_character_rig_or_animation": False,
        "blender_version": bpy.app.version_string,
        "rows": list(ACTORS),
        "columns": list(STATES),
        "inventory": inventory,
        "inventory_all_types": inventory_all,
        "animation_or_driver_owners": animated_owners,
        "mesh_data_blocks": len(bpy.data.meshes),
        "camera_world_bounds": camera_bounds,
        "checks": checks,
        "orientation": {"plane_normal": "+Z", "image_up": "+Y", "camera_view": "-Z", "mirrored": False},
        "render": {"engine": scene.render.engine, "color_transform": scene.view_settings.view_transform, "width": scene.render.resolution_x, "height": scene.render.resolution_y, "file": str(RENDER.relative_to(ROOT))},
        "packed_texture_bytes": sum(item["packed_bytes"] for item in planes),
        "planes": planes,
    }


def build_gallery():
    missing = [path.name for _, _, path in source_paths() if not path.is_file()]
    if missing:
        raise RuntimeError("Final gallery requires all 60 complete state images. Missing: " + ", ".join(missing))
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for data in list(collection):
            if data.users == 0:
                collection.remove(data)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 8
    scene.cycles.use_denoising = False
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    scene.render.film_transparent = False
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.042, 0.049, 0.06, 1)
    scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1
    total_width = LEFT_GUTTER + 6 * PLANE_WIDTH + 5 * COLUMN_GAP + RIGHT_MARGIN
    total_height = TOP_MARGIN + len(ACTORS) * PLANE_HEIGHT + (len(ACTORS) - 1) * ROW_GAP + BOTTOM_MARGIN
    camera_data = bpy.data.cameras.new("Gallery orthographic camera")
    camera = bpy.data.objects.new(camera_data.name, camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (total_width / 2, total_height / 2, 25)
    camera.rotation_euler = (0, 0, 0)
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = total_height
    camera_data.lens = 50
    scene.camera = camera
    scene.render.resolution_x = 3840
    scene.render.resolution_y = round(3840 * total_height / total_width)
    scene.render.resolution_percentage = 100
    # Orthographic scale's sensor fit depends on output aspect ratio. Measure it
    # rather than assuming that its value describes a vertical field of view.
    view_frame = camera_data.view_frame(scene=scene)
    span_y = max(point.y for point in view_frame) - min(point.y for point in view_frame)
    camera_data.ortho_scale *= total_height / span_y
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.quality = 92
    scene.render.filepath = str(RENDER)
    scene.frame_start = scene.frame_end = 1
    heading = emission_material("Caption ivory", (0.8, 0.83, 0.88))
    muted = emission_material("Caption muted", (0.36, 0.41, 0.5))
    caption("SLAY  /  COMPLETE STATE ART REVIEW", 0.3, total_height - 0.35, 0.31, heading)
    caption("60 WHOLE-IMAGE PLANES   /   IDENTICAL FRAMING   /   NO RIGS OR ANIMATION", 0.3, total_height - 0.79, 0.14, muted)
    for column, state in enumerate(STATES):
        x = LEFT_GUTTER + PLANE_WIDTH / 2 + column * (PLANE_WIDTH + COLUMN_GAP)
        caption(state.upper(), x, total_height - 1.22, 0.18, heading, "CENTER")
    objects, sources = [], []
    for row, actor in enumerate(ACTORS):
        y = total_height - TOP_MARGIN - PLANE_HEIGHT / 2 - row * (PLANE_HEIGHT + ROW_GAP)
        caption(actor.upper(), 0.15, y + 0.08, 0.19, heading)
        caption(f"{row + 1:02d}", 0.15, y - 0.21, 0.14, muted)
        for column, state in enumerate(STATES):
            path = ASSETS / f"{actor}-{state}.webp"
            image, source = load_whole_image(path)
            x = LEFT_GUTTER + PLANE_WIDTH / 2 + column * (PLANE_WIDTH + COLUMN_GAP)
            obj = whole_image_plane(f"{actor}-{state}", image, x, y)
            obj["actor"], obj["state"] = actor, state
            objects.append(obj)
            sources.append(source)
            caption(f"{actor.upper()} / {state.upper()}", x, y - PLANE_HEIGHT / 2 - 0.17, 0.12, muted, "CENTER")
    bpy.context.view_layer.update()
    facts = scene_facts(objects, sources, scene)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND), compress=True)
    facts["blend_file"] = str(BLEND.relative_to(ROOT))
    facts["blend_bytes"] = BLEND.stat().st_size
    if facts["blend_bytes"] >= 100_000_000:
        raise RuntimeError("Packed gallery exceeds the 100 MB requirement")
    FACTS.write_text(json.dumps(facts, indent=2) + "\n")
    bpy.ops.render.render(write_still=True)
    print(json.dumps({"blend": str(BLEND), "render": str(RENDER), "facts": str(FACTS), "checks": facts["checks"], "blend_bytes": facts["blend_bytes"]}, indent=2))


if "--check" in sys.argv:
    check_available()
else:
    build_gallery()
