import bpy
import numpy as np
import os
import json

# Set up output directory
output_dir = "Q:\extra\kirmaadaa_3d\\blender\wireframe_plus_8x8"  # Replace with your path
os.makedirs(output_dir, exist_ok=True)

# Initialize a list to store binary frames
binary_frames = []

def process_rendered_frame():
    """Process the rendered frame and convert it to a binary array."""
    try:
        # Access the rendered frame
        rendered_image = bpy.data.images.get('Render Result')

        # Check if the rendered image exists
        if not rendered_image:
            print("Error: 'Render Result' not found. Skipping frame.")
            return

        # Get pixel data (RGBA as a flat list)
        pixels = list(rendered_image.pixels)

        # Check if the pixel data is valid
        if not pixels:
            print("Error: 'Render Result' has no pixel data. Skipping frame.")
            return

        # Get image dimensions
        width, height = rendered_image.size
        if width != 8 or height != 8:
            print(f"Error: Rendered frame is not 8x8 pixels (found {width}x{height}). Skipping frame.")
            return

        # Convert pixels to NumPy array and reshape to (height, width, 4)
        frame_array = np.array(pixels).reshape((height, width, 4))

        # Convert to grayscale by averaging RGB channels
        grayscale_frame = np.mean(frame_array[:, :, :3], axis=2)

        # Threshold to convert to binary (0 or 1)
        binary_frame = (grayscale_frame > 0.5).astype(np.uint8)

        # Append to the binary frames list
        binary_frames.append(binary_frame.tolist())  # Convert NumPy array to Python list for JSON/CSV
        print(f"Frame processed successfully: {len(binary_frames)} frame(s) so far.")

    except Exception as e:
        print(f"Unexpected error while processing the frame: {e}")

def render_animation():
    """Render the animation frame by frame and process each frame."""
    bpy.app.handlers.render_post.append(lambda scene: process_rendered_frame())
    bpy.ops.render.render(animation=True)

def save_as_csv():
    """Save the binary frames as a CSV file."""
    csv_file = os.path.join(output_dir, "binary_frames.csv")
    with open(csv_file, "w") as f:
        for frame_index, frame in enumerate(binary_frames):
            for row in frame:
                f.write(",".join(map(str, row)) + "\n")  # Write each row
            if frame_index < len(binary_frames) - 1:
                f.write("\n")  # Separate frames with a blank line
    print(f"Binary frames saved as a CSV file at {csv_file}")

def save_as_json():
    """Save the binary frames as a JSON file."""
    json_file = os.path.join(output_dir, "binary_frames.json")
    with open(json_file, "w") as f:
        json.dump(binary_frames, f, indent=4)
    print(f"Binary frames saved as a JSON file at {json_file}")

def main():
    """Main function to render and save the animation."""
    render_animation()
    save_as_csv()  # Choose CSV or JSON by uncommenting the desired line
    # save_as_json()  # Uncomment to save as JSON instead

if __name__ == "__main__":
    main()
