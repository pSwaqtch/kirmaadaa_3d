import bpy
import numpy as np
import os
import json
from pathlib import Path
from mathutils import Vector


def export_voxel_data(obj_name, resolution, output_filename):
    # Ensure the object exists
    if obj_name not in bpy.data.objects:
        raise ValueError(f"Object '{obj_name}' not found in the scene")
    
    obj = bpy.data.objects[obj_name]
    dimensions = obj.dimensions
    bbox_min = obj.location - dimensions / 2
    bbox_max = obj.location + dimensions / 2
    
    # Create voxel grid
    voxel_grid = np.zeros((resolution, resolution, resolution), dtype=np.uint8)
    
    # Get bounding box range
    x_range = np.linspace(bbox_min.x, bbox_max.x, resolution)
    y_range = np.linspace(bbox_min.y, bbox_max.y, resolution)
    z_range = np.linspace(bbox_min.z, bbox_max.z, resolution)
    
    # Sample points
    for ix, x in enumerate(x_range):
        for iy, y in enumerate(y_range):
            for iz, z in enumerate(z_range):
                point = (x, y, z)
                # Use local coordinates for ray_cast
                point_local = obj.matrix_world.inverted() @ Vector(point)
                if obj.ray_cast(point_local, (0, 0, 1))[0]:
                    voxel_grid[ix, iy, iz] = 1
    
    # Get the directory of the current blend file
    blend_file_path = bpy.data.filepath
    if not blend_file_path:
        raise ValueError("Please save the Blender file first")
        
    blend_file_dir = os.path.dirname(blend_file_path)
    output_file = os.path.join(blend_file_dir, output_filename)
    
    try:
        # Save as numpy file
        np.save(output_file, voxel_grid)
        print(f"Successfully saved voxel data to {output_file}")
        print(f"Grid shape: {voxel_grid.shape}")
        print(f"Number of occupied voxels: {np.sum(voxel_grid)}")
    except PermissionError:
        print(f"Permission denied when trying to save to {output_file}")
        print("Please ensure you have write permissions in the Blender file directory")
    except Exception as e:
        print(f"Error saving file: {str(e)}")
        
        
def save_npy_as_json(npy_file, json_file):
    # Load the NumPy array from the .npy file
    voxel_data = np.load(npy_file)
    
    # Convert the NumPy array to a Python list (JSON-compatible format)
    voxel_list = voxel_data.tolist()
    
    # Save the list to a JSON file
    with open(json_file, 'w') as f:
        json.dump(voxel_list, f)
    
    print(f"Voxel data saved to {json_file}")

# Example usage - save in same directory as blend file
try:
    export_voxel_data("plus", 32, "voxel_data.npy")
except Exception as e:
    print(f"Error during export: {str(e)}")
    
try:
    save_npy_as_json("voxel_data.npy", "voxel_data.json")
except Exception as e:
    print(f"Error during export: {str(e)}")