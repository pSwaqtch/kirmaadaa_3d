import bpy

# Parameters
n = 8  # Total number of regions (results in n-1 planes)
z_positions = [i * (2 / n) - 1 for i in range(1, n)]  # Calculate evenly spaced positions
z_positions = [round(z, 4) for z in z_positions]  # Round to 2 decimal places

# Create planes and track them
created_planes = []
for z in z_positions:
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, z), scale=(1.1, 1.1, 0.001))
    created_planes.append(bpy.context.active_object)

# Join only the created planes
for obj in created_planes:
    obj.select_set(True)
bpy.ops.object.join()



import bpy
import math

# Parameters
num_planes = 32
angle_increment = math.radians(360 / num_planes)

# Create planes and track them
created_planes = []
bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0), scale=(1.1, 0.001, 1.1))
for _ in range(1, num_planes):
    bpy.ops.object.duplicate_move()
    bpy.ops.transform.rotate(value=angle_increment, orient_axis='Z')
    created_planes.append(bpy.context.active_object)

# Join only the created planes
for obj in created_planes:
    obj.select_set(True)
bpy.ops.object.join()