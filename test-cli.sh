#!/bin/bash
set -e

CLI="./dist/cli/index.js"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing ofx-code CLI ===${NC}\n"

# 检查构建产物
if [ ! -f "$CLI" ]; then
    echo "❌ CLI not found. Run 'bun run build' first."
    exit 1
fi

echo -e "${GREEN}1. Version check${NC}"
$CLI version
echo ""

echo -e "${GREEN}2. Help check${NC}"
$CLI --help | head -10
echo ""

echo -e "${GREEN}3. Install help${NC}"
$CLI install --help | head -15
echo ""

echo -e "${GREEN}4. Doctor (installation category only)${NC}"
$CLI doctor --category installation 2>&1 | head -20
echo ""

echo -e "${GREEN}5. Get local version (JSON)${NC}"
$CLI get-local-version --json 2>&1 | jq . 2>/dev/null || $CLI get-local-version --json
echo ""

echo -e "${BLUE}=== All basic tests passed ===${NC}"
