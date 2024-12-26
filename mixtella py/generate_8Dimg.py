#!/bin/env python3

from PIL import Image, ImageDraw
import os

# Directory to save the images
output_dir = "generated_images_8x10"
os.makedirs(output_dir, exist_ok=True)

# Function to generate an 8x10 image
def generate_image(pattern_func, frame_number):
    img = Image.new("RGB", (8, 10), "black")  # Create an 8x10 black image
    draw = ImageDraw.Draw(img)

    # Apply the pattern function
    pattern_func(draw, frame_number)

    # Save the image
    img.save(f"{output_dir}/frame_{frame_number:02d}.png")
    print(f"Generated frame_{frame_number:02d}.png")

# Example pattern functions
def pattern_static(draw, frame_number):
    # Example: Create a checkerboard pattern
    for x in range(8):
        for y in range(10):
            if (x + y) % 2 == 0:
                draw.rectangle([x, y, x, y], fill="white")

def pattern_scrolling(draw, frame_number):
    # Example: Create a scrolling vertical line
    for y in range(10):
        x = (frame_number + y) % 8
        draw.rectangle([x, y, x, y], fill="white")

def pattern_diagonal_wave(draw, frame_number):
    # Example: Create a diagonal wave pattern
    for x in range(8):
        y = (x + frame_number) % 10
        draw.rectangle([x, y, x, y], fill="white")

# Generate images using the selected pattern
num_frames = 24  # Number of frames to generate
for frame in range(num_frames):
    generate_image(pattern_diagonal_wave, frame)

print(f"Images saved in '{output_dir}' directory.")
