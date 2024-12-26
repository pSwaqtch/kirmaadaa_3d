#!/bin/env python3

import sys
import re

def decode_matrix(matrix_str):
    try:
        # Parse the input string into a list of integers
        matrix = [int(x, 16) for x in re.findall(r"0x[0-9A-Fa-f]+", matrix_str)]

        # Initialize an 8x10 matrix with zeros
        output_matrix = [[0 for _ in range(len(matrix))] for _ in range(10)]

        # Process each 32-bit word
        for col, word in enumerate(matrix):
            for row in range(10):
                if row < 8:
                    output_matrix[row][col] = (word >> (row + 8)) & 1
                elif row == 8:
                    output_matrix[row][col] = (word >> 16) & 1
                elif row == 9:
                    output_matrix[row][col] = (word >> 26) & 1

        return output_matrix

    except ValueError:
        print("Error: Invalid input format. Please provide a valid matrix string.")
        sys.exit(1)


def print_matrix(matrix):
    for row in matrix:
        print(" ".join(map(str, row)))

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 decode_matrix.py \"{matrix_string}\"")
        sys.exit(1)

    input_matrix_str = sys.argv[1]
    decoded_matrix = decode_matrix(input_matrix_str)

    print("Decoded 8x10 Matrix:")
    print_matrix(decoded_matrix)
