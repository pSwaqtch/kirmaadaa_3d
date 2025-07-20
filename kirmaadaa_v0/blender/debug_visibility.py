import bpy
import sys

# Get the file path from CLI arguments
if len(sys.argv) < 5:  # Blender passes extra args, so the actual file arg starts at index 4
    print("Usage: blender --background --python debug_visibility.py -- <blend_file>")
    sys.exit(1)

blend_file_path = sys.argv[4]  # First argument after '--'

# Load the .blend file
print(f"Opening file: {blend_file_path}")
bpy.ops.wm.open_mainfile(filepath=blend_file_path)

# Check visibility settings
print("\n=== Object Visibility Debugging ===")
for obj in bpy.data.objects:
    print(f"{obj.name}:")
    print(f"  Viewport Hidden: {obj.hide_viewport}")
    print(f"  Render Hidden: {obj.hide_render}")
    print(f"  In Hidden Collection: {any(coll.hide_viewport for coll in obj.users_collection)}")
    print("-" * 40)
