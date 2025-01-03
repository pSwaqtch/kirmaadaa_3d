import bpy
import numpy as np
from mathutils import Vector

# Parameters for the cylindrical grid
num_radial = 50  # Number of divisions along the radius
num_angular = 50  # Number of divisions along theta
num_z = 50  # Number of divisions along height (z-axis)

# Get the active object
obj = bpy.context.active_object

# Convert the object to a mesh (if not already)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.convert(target='MESH')

# Get the object's bounding box in world coordinates
min_bound = obj.matrix_world @ Vector(obj.bound_box[0])
max_bound = obj.matrix_world @ Vector(obj.bound_box[6])
height = max_bound.z - min_bound.z
radius = max(max_bound.x - min_bound.x, max_bound.y - min_bound.y) / 2

# Generate cylindrical grid
r_range = np.linspace(0, radius, num_radial)
theta_range = np.linspace(0, 2 * np.pi, num_angular)
z_range = np.linspace(min_bound.z, max_bound.z, num_z)

# Initialize a 3D array to store the grid data
cylindrical_matrix = np.zeros((num_radial, num_angular, num_z), dtype=np.int8)

# Check if points in cylindrical space intersect with the object
for ir, r in enumerate(r_range):
    for it, theta in enumerate(theta_range):
        for iz, z in enumerate(z_range):
            # Convert cylindrical (r, theta, z) to Cartesian (x, y, z)
            x = r * np.cos(theta)
            y = r * np.sin(theta)
            point = (x, y, z)
            
            # Check intersection with object
            result, _, _, _ = obj.closest_point_on_mesh(point)
            if result:
                cylindrical_matrix[ir, it, iz] = 1

# Save the cylindrical matrix as a JSON file
import json
json_data = {
    "matrix": cylindrical_matrix.tolist(),  # Convert NumPy array to a nested list
    "resolution": {
        "radial": num_radial,
        "angular": num_angular,
        "z": num_z
    }
}

with open("cylindrical_object_matrix.json", "w") as json_file:
    json.dump(json_data, json_file, indent=4)

print("Cylindrical matrix data saved as 'cylindrical_object_matrix.json'")
