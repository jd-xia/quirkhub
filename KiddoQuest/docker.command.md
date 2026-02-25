docker run -d \
  --name kiddoquest-backend \
  --restart unless-stopped \
  -p 8081:8081 \
  kiddoquest



  curl -v telnet://localhost:8081


  docker build -t  kiddoquest-frontend:latest .