docker run -d \
  --name kiddoquest-backend \
  --restart unless-stopped \
  -p 8081:8081 \
  kiddoquest



  curl -v telnet://localhost:8081


  docker build -t  kiddoquest-frontend:latest .



# stop the old container
docker stop jenkins

# remove the old container
docker rm jenkins

# now you can run a new one with the same name
docker run -d \
  --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /usr/bin/docker:/usr/bin/docker \
  -v /usr/libexec/docker/cli-plugins:/usr/local/lib/docker/cli-plugins \
  --group-add $(stat -c '%g' /var/run/docker.sock) \
  --restart unless-stopped \
  jenkins/jenkins


      docker run -d --name kiddoquest-frontend \
  -p 8082:80 \
  -e BACKEND_URL=http://192.168.44.128:8081 \
  --restart unless-stopped \
  jiandao/kiddoquest-frontend:latest