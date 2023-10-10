# Use an official Python runtime as a parent image
FROM python:3.11.6-slim-bullseye

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --trusted-host pypi.python.org -r requirements.txt

# Make port 80 available to the world outside this container
EXPOSE 8080

# Define environment variable
ENV NAME World

# Replace 'your_module' with the actual name of your Python file, e.g., 'app'
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app