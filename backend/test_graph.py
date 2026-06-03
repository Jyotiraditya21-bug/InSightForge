import os
import sys

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from graph import graph

if __name__ == "__main__":
    print("Graph compiled successfully!")
    print("Nodes in workflow:")
    for node_name in graph.nodes:
        print(f" - {node_name}")
        
    print("\nGraph verification complete!")
