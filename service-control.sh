#!/bin/bash
# Git Rules MCP Server Service Control Script

SERVICE_NAME="gitrules-mcp-server.service"

case "$1" in
  start)
    echo "Starting $SERVICE_NAME..."
    systemctl --user start $SERVICE_NAME
    ;;
  stop)
    echo "Stopping $SERVICE_NAME..."
    systemctl --user stop $SERVICE_NAME
    ;;
  restart)
    echo "Restarting $SERVICE_NAME..."
    systemctl --user restart $SERVICE_NAME
    ;;
  status)
    systemctl --user status $SERVICE_NAME
    ;;
  logs)
    journalctl --user -u $SERVICE_NAME -f
    ;;
  enable)
    echo "Enabling $SERVICE_NAME to start on boot..."
    systemctl --user enable $SERVICE_NAME
    ;;
  disable)
    echo "Disabling $SERVICE_NAME from starting on boot..."
    systemctl --user disable $SERVICE_NAME
    ;;
  test)
    echo "Testing server connectivity..."
    curl -s localhost:3030/health | jq '.' || echo "Service not accessible on localhost:3030"
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs|enable|disable|test}"
    echo "  start   - Start the service"
    echo "  stop    - Stop the service" 
    echo "  restart - Restart the service"
    echo "  status  - Show service status"
    echo "  logs    - Follow service logs"
    echo "  enable  - Enable service to start on boot"
    echo "  disable - Disable service from starting on boot"
    echo "  test    - Test server connectivity"
    exit 1
    ;;
esac