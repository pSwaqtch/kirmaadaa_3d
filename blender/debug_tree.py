import bpy
import sys

def print_tree(collection, indent=0):
    """ Recursively prints collection and object hierarchy with visibility status. """
    prefix = " " * indent
    print(f"{prefix}- Collection: {collection.name} (Hidden: {collection.hide_viewport})")

    for obj in collection.objects:
        print(f"{prefix}  - Object: {obj.name} (Hidden: {obj.hide_viewport}, Render Hidden: {obj.hide_render})")

    for sub_collection in collection.children:
        print_tree(sub_collection, indent + 2)

# Get the file path from CLI arguments
if len(sys.argv) < 5:  # Blender passes extra args; first useful arg is at index 4
    print("Usage: blender --background --python debug_tree.py -- <blend_file>")
    sys.exit(1)

blend_file_path = sys.argv[4]  # File name from CLI

# Load the .blend file
print(f"Opening file: {blend_file_path}")
bpy.ops.wm.open_mainfile(filepath=blend_file_path)

# Print the hierarchy tree
print("\n=== Scene Hierarchy ===")
for collection in bpy.data.collections:
    if not collection.users:  # Skip orphaned collections
        continue
    print_tree(collection)

# Also print objects not in a collection (orphans)
orphans = [obj for obj in bpy.data.objects if not obj.users_collection]
if orphans:
    print("\n=== Orphaned Objects (Not in any collection) ===")
    for obj in orphans:
        print(f"- {obj.name} (Hidden: {obj.hide_viewport}, Render Hidden: {obj.hide_render})")
