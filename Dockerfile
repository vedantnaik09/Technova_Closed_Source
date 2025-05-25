FROM node:18

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend package files first for better caching
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy AI requirements
COPY AI/Models/requirements.txt ./AI/Models/

# Create Python virtual environment and install packages
RUN cd AI/Models && python3 -m venv venv && \
    . venv/bin/activate && \
    pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy all application code
COPY . .

# Create uploads directory
RUN mkdir -p backend/uploads/audios backend/uploads/resume

# Expose the main port
EXPOSE 5000

# Start the Node.js server (which will start Python internally)
CMD ["npm", "start", "--prefix", "backend"]