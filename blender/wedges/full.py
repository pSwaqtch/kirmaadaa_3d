import bpy
import math

def clear_scene():
    """Clear existing mesh objects from scene"""
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.object.select_by_type(type='MESH')
    bpy.ops.object.delete()

def create_horizontal_planes(count=8, scale=1.1, thickness=0.001):
    """Create evenly spaced horizontal planes"""
    planes = []
    z_positions = [i * (2 / count) - 1 for i in range(1, count)]
    
    for z in z_positions:
        bpy.ops.mesh.primitive_cube_add(location=(0, 0, z), 
                                        scale=(scale, scale, thickness))
        planes.append(bpy.context.active_object)
    return planes

def create_vertical_planes(count=32, scale=1.1, thickness=0.001):
    """Create radially arranged vertical planes"""
    planes = []
    angle_increment = math.radians(360 / count)
    
    # Create initial plane
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0), 
                                    scale=(scale, thickness, scale))
    base_plane = bpy.context.active_object
    planes.append(base_plane)
    
    # Create duplicates and rotate
    for i in range(1, count):
        bpy.ops.object.duplicate_move()
        bpy.ops.transform.rotate(value=angle_increment, orient_axis='Z')
        planes.append(bpy.context.active_object)
    
    return planes

def join_objects(objects):
    """Join list of objects into single mesh"""
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    return bpy.context.active_object

def create_plane_grid(horizontal_count=8, vertical_count=32, scale=1.1, thickness=0.001):
    """Create complete grid of horizontal and vertical planes"""
    clear_scene()
    
    # Create both sets of planes
    horizontal_planes = create_horizontal_planes(horizontal_count, scale, thickness)
    vertical_planes = create_vertical_planes(vertical_count, scale, thickness)
    
    # Join all planes
    all_planes = horizontal_planes + vertical_planes
    final_mesh = join_objects(all_planes)
    
    return final_mesh

def create_hollow_cylinder(radius=1.0, height=2.2, thickness=0.01, location=(0, 0, 0)):
    """Create a hollow cylinder using boolean difference"""
    
    # Create outer cylinder
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=height, location=location)
    outer = bpy.context.active_object

    # Create inner cylinder for boolean
    bpy.ops.mesh.primitive_cylinder_add(radius=radius-thickness, depth=height, location=location)
    inner = bpy.context.active_object

    # Setup and apply boolean modifier
    bool_mod = outer.modifiers.new(name="Hollow", type='BOOLEAN')
    bool_mod.operation = 'DIFFERENCE'
    bool_mod.object = inner
    bpy.context.view_layer.objects.active = outer
    bpy.ops.object.modifier_apply(modifier="Hollow")

    # Cleanup
    bpy.data.objects.remove(inner, do_unlink=True)
    return outer

def create_concentric_cylinders(radii=[0.8, 0.6, 0.4, 0.2], height=2.2, thickness=0.01, location=(0, 0, 0)):
    """Create multiple concentric hollow cylinders"""
    cylinders = []
    for radius in radii:
        cylinder = create_hollow_cylinder(radius=radius, height=height, thickness=thickness, location=location)
        cylinders.append(cylinder)
    return cylinders

def create_complete_scene(horizontal_count=8, vertical_count=32, cylinder_radii=[0.8, 0.6, 0.4, 0.2]):
    """Create a grid and add concentric hollow cylinders"""
    grid = create_plane_grid(horizontal_count=horizontal_count, vertical_count=vertical_count)
    
    # Add the concentric hollow cylinders in the center
    cylinders = create_concentric_cylinders(radii=cylinder_radii, height=2.2, thickness=0.01)
    
    # Optionally, join the cylinders and the grid into a single object
    objects = [grid] + cylinders
    final_mesh = join_objects(objects)
    
    return final_mesh

# Create the grid and hollow cylinders in the scene
create_complete_scene()

# Example usage with custom parameters:
# create_complete_scene(horizontal_count=12, vertical_count=48, cylinder_radii=[1.0, 0.8, 0.6])
