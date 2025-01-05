import bpy
import math
from math import radians

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
    angle_increment = radians(360 / count)
    
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

# Create the grid with default parameters
grid = create_plane_grid()

# Example usage with custom parameters:
# grid = create_plane_grid(horizontal_count=12, vertical_count=48, scale=2.0, thickness=0.002)
