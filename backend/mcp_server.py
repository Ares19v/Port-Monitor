from mcp.server.fastmcp import FastMCP
import core

# Create the MCP server
mcp = FastMCP("Port-Monitor")

@mcp.tool()
def get_active_ports() -> str:
    """Get a list of all active network ports on the system and the processes using them."""
    ports = core.get_active_ports()
    if not ports:
        return "No active ports found or unable to access port information."
    
    result = "Active Ports:\n"
    for p in ports:
        result += f"Port: {p['port']} ({p['protocol']}) | PID: {p['pid']} | Process: {p['process_name']} | Status: {p['status']}\n"
    return result

@mcp.tool()
def kill_process(pid: int) -> str:
    """Kill a process by its PID. Extremely useful for freeing up ports."""
    result = core.kill_process_by_pid(pid)
    return result["message"]

if __name__ == "__main__":
    # Run the MCP server over standard input/output
    mcp.run()
