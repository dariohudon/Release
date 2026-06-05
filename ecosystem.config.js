module.exports = {
  apps: [
    {
      name: "release",
      cwd: "/var/www/release",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3033
      }
    }
  ]
};
