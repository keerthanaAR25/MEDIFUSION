#!/bin/bash
set -e

echo "🚀 Setting up MediFusion..."
echo ""

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

print_step() { echo -e "${CYAN}[STEP]${NC} $1"; }
print_ok() { echo -e "${GREEN}[OK]${NC} $1"; }
print_err() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
print_step "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { print_err "Node.js not found. Install from nodejs.org"; exit 1; }
command -v python3 >/dev/null 2>&1 || { print_err "Python 3 not found"; exit 1; }
print_ok "Node.js and Python found"

# Setup frontend
print_step "Installing frontend dependencies..."
cd frontend
npm install
cd ..
print_ok "Frontend ready"

# Setup backend
print_step "Installing backend dependencies..."
cd backend
pip3 install -r requirements.txt --quiet
cd ..
print_ok "Backend ready"

# Install Tesseract
print_step "Checking Tesseract OCR..."
if command -v tesseract >/dev/null 2>&1; then
    print_ok "Tesseract found: $(tesseract --version | head -1)"
else
    print_err "Tesseract not found. Install:"
    echo "  macOS: brew install tesseract"
    echo "  Ubuntu: sudo apt install tesseract-ocr"
    echo "  Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki"
fi

# Check Ollama
print_step "Checking Ollama (local LLM)..."
if command -v ollama >/dev/null 2>&1; then
    print_ok "Ollama found"
    echo "  Starting Ollama and pulling llama3..."
    ollama serve &
    sleep 3
    ollama pull llama3 || echo "  Model pull queued (may take time on first run)"
else
    echo -e "${CYAN}Ollama not found. Install from: https://ollama.ai${NC}"
    echo "  After install:"
    echo "  1. ollama serve"
    echo "  2. ollama pull llama3"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ MediFusion Setup Complete!${NC}"
echo "========================================"
echo ""
echo "Start the system:"
echo ""
echo "Terminal 1 (AI):"
echo "  ollama serve"
echo "  ollama pull llama3"
echo ""
echo "Terminal 2 (Backend):"
echo "  cd backend && python main.py"
echo ""
echo "Terminal 3 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "Open: http://localhost:3000"
echo "Login: drchen / doctor123"
echo "       patient1 / patient123"
echo ""