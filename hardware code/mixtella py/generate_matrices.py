import re
import sys

# Function to decode a single slice (matrix string) into a 10x8 matrix
def decode_matrix(matrix_str):
    try:
        # Parse the input string into a list of integers
        matrix = [int(x, 16) for x in re.findall(r"0x[0-9A-Fa-f]+", matrix_str)]

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

        return output_matrix

    except ValueError:
        print("Error: Invalid input format. Please provide a valid matrix string.")
        sys.exit(1)

# Function to parse and decode the framedata structure from the file
def parse_framedata(file_path):
    with open(file_path, "r") as f:
        content = f.read()

    # Extract each slice (row of 8 hex values) as a separate string
    slices = re.findall(r"{\s*([0x0-9A-Fa-f, ]+)\s*}", content)

    # Decode each slice using the decode_matrix function
    decoded_slices = [decode_matrix(slice_str) for slice_str in slices]
    return decoded_slices

# Format and print the output matrices
def format_output(decoded_slices):
    output = []
    for slice_number, matrix in enumerate(decoded_slices, start=1):
        output.append(f"[Slice {slice_number}]\n")
        for row in matrix:
            output.append(" ".join(map(str, row)) + "\n")
        output.append("\n")  # Separate slices with a blank line
    return "".join(output)

# Main logic
if __name__ == "__main__":
    input_file = "file.txt"  # Path to the input file
    try:
        # Parse and decode the framedata
        decoded_slices = parse_framedata(input_file)

        # Generate formatted output
        formatted_output = format_output(decoded_slices)

        # Save the output to a file
        with open("decoded_matrices.txt", "w") as f:
            f.write(formatted_output)

        print("Decoded matrices saved to 'decoded_matrices.txt'")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
