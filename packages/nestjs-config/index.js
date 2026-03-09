const dotenv = require('dotenv');

class ConfigModule {
  static forRoot(options = {}) {
    const paths = Array.isArray(options.envFilePath) ? options.envFilePath : [options.envFilePath];
    for (const p of paths) {
      if (!p) continue;
      dotenv.config({ path: p });
    }
    if (!options.envFilePath) {
      dotenv.config();
    }
    return {
      module: ConfigModule,
      global: Boolean(options.isGlobal)
    };
  }
}

module.exports = { ConfigModule };
