module.exports = {
  apps: [
    {
      name: 'smartpay',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 6188
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 6188
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
      time: true
    }
  ]
};
