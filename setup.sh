#!/bin/bash

echo "🚀 Starting DevSecOps Environment Setup..."

# Start services
echo "📦 Starting Docker services..."
docker-compose up -d

# Wait for Jenkins to be ready
echo "⏳ Waiting for Jenkins to start..."
until curl -s http://localhost:8081/login > /dev/null; do
  sleep 5
  echo "Waiting for Jenkins..."
done

echo "✅ Jenkins is ready!"

# Get initial admin password
PASSWORD=$(docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword)
echo "🔑 Jenkins initial password: $PASSWORD"

# Install plugins (this is basic, would need more automation for full setup)
echo "🔧 Installing Jenkins plugins..."
# Note: Full automation would require Jenkins CLI or API calls

echo "🎯 Setup complete!"
echo ""
echo "🌐 Access points:"
echo "  Jenkins: http://localhost:8081"
echo "  SonarQube: http://localhost:9000"
echo ""
echo "📋 Next steps:"
echo "1. Open Jenkins at http://localhost:8081"
echo "2. Use password: $PASSWORD"
echo "3. Install suggested plugins"
echo "4. Configure SonarQube server in Jenkins"
echo "5. Create and run the DevSecOps pipeline"
echo ""
echo "Your DevSecOps environment is ready! 🎉"