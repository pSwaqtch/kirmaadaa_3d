import re
import sys
import argparse

def decode_matrix(matrix_str):
    try:
        print(f"Decoding matrix: {matrix_str}")  # Debugging: Log input string
        # Parse the input string into a list of integers
        matrix = [int(x, 16) for x in re.findall(r"0x[0-9A-Fa-f]+", matrix_str)]
        print(f"Parsed matrix: {matrix}")  # Debugging: Log parsed matrix

        # Initialize a 10x8 matrix with zeros
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

        print(f"Decoded output matrix:\n{output_matrix}")  # Debugging: Log output matrix
        return output_matrix

    except ValueError:
        print("Error: Invalid input format. Please provide a valid matrix string.")
        sys.exit(1)

def parse_framedata(file_path):
    try:
        # Open file with UTF-16 encoding
        with open(file_path, "r", encoding="utf-16") as f:
            content = f.read()
        print("File content read successfully.")  # Debugging: Confirm file reading
        print("Content preview:\n", content[:500])  # Debugging: Show the first 500 characters

        # Extract each slice (row of 8 hex values) as a separate string
        slices = re.findall(r"{\s*([0x0-9A-Fa-f, ]+)\s*}", content)
        print(f"Extracted {len(slices)} slices: {slices}")  # Debugging: Log slices

        # Decode each slice using the decode_matrix function
        decoded_slices = [decode_matrix(slice_str) for slice_str in slices]
        return decoded_slices

    except Exception as e:
        print(f"Error while parsing framedata: {e}")
        sys.exit(1)


def format_output(decoded_slices):
    output = []
    for slice_number, matrix in enumerate(decoded_slices, start=1):
        output.append(f"[Slice {slice_number}]\n")
        for row in matrix:
            output.append(" ".join(map(str, row)) + "\n")
        output.append("\n")
    return "".join(output)

if __name__ == "__main__":
    # Set up argument parser
    parser = argparse.ArgumentParser(description="Decode framedata from an input file.")
    parser.add_argument("input_file", help="Path to the input file containing framedata.")
    parser.add_argument("-o", "--output", default="decoded_matrices.txt", help="Path to save the decoded output.")
    
    # Parse arguments
    args = parser.parse_args()
    input_file = args.input_file
    output_file = args.output

    try:
        # Parse and decode the framedata
        decoded_slices = parse_framedata(input_file)
        print("Decoded slices successfully.")  # Debugging: Confirm decoding

        # Generate formatted output
        formatted_output = format_output(decoded_slices)
        print("Formatted output preview:\n", formatted_output[:500])  # Debugging: Preview output

        # Save the output to a file
        with open(output_file, "w") as f:
            f.write(formatted_output)
        print(f"Decoded matrices saved to '{output_file}'")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
