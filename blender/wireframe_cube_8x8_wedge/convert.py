#!/bin/env python3

import sys, os
import json
from PIL import Image

if len(sys.argv) != 2:
    print("Usage: ", sys.argv[0], "dir")
    exit()

def image_to_bytes(i):
    im = Image.open(i)
    w, h = im.size
    pixels = [1 if p[0] > 2 else 0 for p in list(im.getdata())]
    frame_data = []

    for x in range(w):
        word = 0x0401FF00 | (1 << x)

        for y in range(h):
            p = pixels[y * 8 + x]
            if p:
                if y == 8:
                    word &= ~(1 << 16)
                elif y == 9:
                    word &= ~(1 << 26)
                else:
                    word &= ~(1 << (y + 8))

        frame_data.append(f"{word:08X}")

    return frame_data

# Get the list of image files
files = [os.path.join(sys.argv[1], f) for f in os.listdir(sys.argv[1])]
files.sort()

# Prepare a list to hold the frames data
frames = []

# Loop over all files and convert each image to bytes
for idx, f in enumerate(files):
    if idx % 32 == 0:
        frames.append([])

    frames[-1].append(image_to_bytes(f))

# Define the resolution structure
resolution = {
    "frames": len(frames),
    "slices": len(frames[0]) if frames else 0,
    "columns": 8,  # Adjust based on actual image column size
    "rows": 8      # Adjust based on actual image row size
}

# Prepare the final output structure
output = {
    "resolution": resolution,
    "data": frames
}

# Print JSON output
print(json.dumps(output, indent=4))
