for (const envFile of ['.env.local', '.env']) {
  try {
    process.loadEnvFile?.(envFile);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}
