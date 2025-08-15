import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, Code, Eye, Book, Palette, Navigation, Settings } from 'lucide-react';

const DocsJsonSandbox = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [parsedConfig, setParsedConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('editor');

  // Default example configuration
  const defaultConfig = {
    "$schema": "https://mintlify.com/docs.json",
    "theme": "mint",
    "name": "My Documentation",
    "colors": {
      "primary": "#0066cc"
    },
    "navigation": {
      "groups": [
        {
          "group": "Getting Started",
          "pages": [
            "introduction",
            "quickstart"
          ]
        },
        {
          "group": "API Reference",
          "pages": [
            "api/authentication",
            "api/users"
          ]
        }
      ]
    }
  };

  // Validation schema based on Mintlify docs
  const validateDocsJson = (config) => {
    const errors = [];
    const warnings = [];

    // Required fields validation
    if (!config.theme) {
      errors.push("'theme' is required. Must be one of: mint, maple, palm, willow, linden, almond, aspen");
    } else {
      const validThemes = ['mint', 'maple', 'palm', 'willow', 'linden', 'almond', 'aspen'];
      if (!validThemes.includes(config.theme)) {
        errors.push(`Invalid theme '${config.theme}'. Must be one of: ${validThemes.join(', ')}`);
      }
    }

    if (!config.name) {
      errors.push("'name' is required. This is the name of your project, organization, or product");
    }

    if (!config.colors || !config.colors.primary) {
      errors.push("'colors.primary' is required. Must be a hex color code starting with #");
    } else if (config.colors.primary && !config.colors.primary.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.push("'colors.primary' must be a valid hex color code (e.g., #ff0000)");
    }

    if (!config.navigation) {
      errors.push("'navigation' is required. Define your documentation structure");
    } else {
      // Validate navigation structure
      if (config.navigation.groups) {
        config.navigation.groups.forEach((group, index) => {
          if (!group.group) {
            errors.push(`Navigation group at index ${index} is missing 'group' property`);
          }
          if (!group.pages || !Array.isArray(group.pages)) {
            errors.push(`Navigation group '${group.group}' is missing 'pages' array`);
          }
          
          // Check for reserved paths
          if (group.pages) {
            group.pages.forEach(page => {
              if (typeof page === 'string' && (page.includes('/api') || page.includes('/mcp'))) {
                warnings.push(`Page '${page}' uses reserved path. /api and /mcp paths are reserved and may cause 404 errors`);
              }
            });
          }
        });
      }

      if (config.navigation.tabs) {
        config.navigation.tabs.forEach((tab, index) => {
          if (!tab.name) {
            errors.push(`Navigation tab at index ${index} is missing 'name' property`);
          }
          if (!tab.url) {
            errors.push(`Navigation tab '${tab.name}' is missing 'url' property`);
          }
        });
      }
    }

    // Optional field validation
    if (config.colors) {
      ['light', 'dark'].forEach(mode => {
        if (config.colors[mode] && !config.colors[mode].match(/^#[0-9A-Fa-f]{6}$/)) {
          errors.push(`'colors.${mode}' must be a valid hex color code (e.g., #ff0000)`);
        }
      });
    }

    if (config.favicon && typeof config.favicon !== 'string') {
      if (config.favicon.light && typeof config.favicon.light !== 'string') {
        warnings.push("'favicon.light' should be a string path to favicon file");
      }
      if (config.favicon.dark && typeof config.favicon.dark !== 'string') {
        warnings.push("'favicon.dark' should be a string path to favicon file");
      }
    }

    if (config.logo && typeof config.logo !== 'string') {
      if (config.logo.light && typeof config.logo.light !== 'string') {
        warnings.push("'logo.light' should be a string path to logo file");
      }
      if (config.logo.dark && typeof config.logo.dark !== 'string') {
        warnings.push("'logo.dark' should be a string path to logo file");
      }
    }

    // Best practices warnings
    if (!config.$schema) {
      warnings.push("Consider adding '$schema': 'https://mintlify.com/docs.json' for better IDE support");
    }

    if (!config.description) {
      warnings.push("Consider adding 'description' for better SEO and AI indexing");
    }

    return { errors, warnings, isValid: errors.length === 0 };
  };

  useEffect(() => {
    setJsonInput(JSON.stringify(defaultConfig, null, 2));
  }, []);

  useEffect(() => {
    if (!jsonInput.trim()) {
      setValidationResult(null);
      setParsedConfig(null);
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setParsedConfig(parsed);
      const validation = validateDocsJson(parsed);
      setValidationResult(validation);
    } catch (error) {
      setValidationResult({
        errors: [`JSON Parse Error: ${error.message}`],
        warnings: [],
        isValid: false
      });
      setParsedConfig(null);
    }
  }, [jsonInput]);

  const renderValidation = () => {
    if (!validationResult) return null;

    return (
      <div className="space-y-4">
        {validationResult.isValid && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-green-700 font-medium">Valid docs.json configuration!</span>
          </div>
        )}

        {validationResult.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Errors ({validationResult.errors.length})
            </h4>
            <div className="space-y-1">
              {validationResult.errors.map((error, index) => (
                <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {validationResult.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-yellow-700 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Warnings ({validationResult.warnings.length})
            </h4>
            <div className="space-y-1">
              {validationResult.warnings.map((warning, index) => (
                <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
                  {warning}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPreview = () => {
    if (!parsedConfig || !validationResult?.isValid) {
      return (
        <div className="p-8 text-center text-gray-500">
          <Book className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Enter valid JSON to see preview</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Site Header Preview */}
        <div className="border rounded-lg overflow-hidden">
          <div 
            className="p-4 text-white" 
            style={{ backgroundColor: parsedConfig.colors?.primary || '#0066cc' }}
          >
            <h2 className="text-xl font-bold">{parsedConfig.name}</h2>
            {parsedConfig.description && (
              <p className="text-sm opacity-90 mt-1">{parsedConfig.description}</p>
            )}
          </div>
        </div>

        {/* Theme Preview */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Theme Configuration
          </h3>
          <div className="space-y-2 text-sm">
            <div><strong>Theme:</strong> {parsedConfig.theme}</div>
            <div><strong>Primary Color:</strong> 
              <span 
                className="inline-block w-4 h-4 ml-2 rounded border"
                style={{ backgroundColor: parsedConfig.colors?.primary }}
              ></span>
              {parsedConfig.colors?.primary}
            </div>
            {parsedConfig.colors?.light && (
              <div><strong>Light Mode Color:</strong> 
                <span 
                  className="inline-block w-4 h-4 ml-2 rounded border"
                  style={{ backgroundColor: parsedConfig.colors.light }}
                ></span>
                {parsedConfig.colors.light}
              </div>
            )}
            {parsedConfig.colors?.dark && (
              <div><strong>Dark Mode Color:</strong> 
                <span 
                  className="inline-block w-4 h-4 ml-2 rounded border"
                  style={{ backgroundColor: parsedConfig.colors.dark }}
                ></span>
                {parsedConfig.colors.dark}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Preview */}
        {parsedConfig.navigation && (
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Navigation Structure
            </h3>
            
            {/* Tabs Preview */}
            {parsedConfig.navigation.tabs && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Tabs</h4>
                <div className="flex gap-2 border-b">
                  {parsedConfig.navigation.tabs.map((tab, index) => (
                    <div key={index} className="px-3 py-2 border-b-2 border-blue-500 text-sm font-medium">
                      {tab.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Groups Preview */}
            {parsedConfig.navigation.groups && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-600">Groups</h4>
                {parsedConfig.navigation.groups.map((group, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4">
                    <h5 className="font-medium text-gray-800 mb-2">{group.group}</h5>
                    {group.pages && (
                      <ul className="space-y-1 text-sm text-gray-600">
                        {group.pages.map((page, pageIndex) => (
                          <li key={pageIndex} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            {typeof page === 'string' ? page : page.toString()}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Additional Config Preview */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Additional Configuration
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Schema:</strong> {parsedConfig.$schema ? '✓ Configured' : '✗ Not set'}
            </div>
            <div>
              <strong>Favicon:</strong> {parsedConfig.favicon ? '✓ Configured' : '✗ Not set'}
            </div>
            <div>
              <strong>Logo:</strong> {parsedConfig.logo ? '✓ Configured' : '✗ Not set'}
            </div>
            <div>
              <strong>Description:</strong> {parsedConfig.description ? '✓ Configured' : '✗ Not set'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const loadExample = (example) => {
    const examples = {
      minimal: {
        "$schema": "https://mintlify.com/docs.json",
        "theme": "mint",
        "name": "Minimal Docs",
        "colors": {
          "primary": "#10B981"
        },
        "navigation": {
          "groups": [
            {
              "group": "Getting Started",
              "pages": ["introduction"]
            }
          ]
        }
      },
      complete: {
        "$schema": "https://mintlify.com/docs.json",
        "theme": "maple",
        "name": "Complete Documentation",
        "description": "Comprehensive documentation site with all features",
        "colors": {
          "primary": "#F59E0B",
          "light": "#FCD34D",
          "dark": "#D97706"
        },
        "logo": {
          "light": "/logo-light.png",
          "dark": "/logo-dark.png",
          "href": "https://example.com"
        },
        "favicon": "/favicon.ico",
        "navigation": {
          "tabs": [
            {
              "name": "Documentation",
              "url": "docs"
            },
            {
              "name": "API Reference",
              "url": "api"
            }
          ],
          "groups": [
            {
              "group": "Getting Started",
              "pages": [
                "introduction",
                "quickstart",
                "installation"
              ]
            },
            {
              "group": "Guides",
              "pages": [
                "guides/authentication",
                "guides/errors"
              ]
            }
          ]
        },
        "integrations": {
          "ga4": {
            "measurementId": "G-XXXXXXX"
          }
        }
      },
      api: {
        "$schema": "https://mintlify.com/docs.json",
        "theme": "willow",
        "name": "API Documentation",
        "colors": {
          "primary": "#8B5CF6"
        },
        "navigation": {
          "groups": [
            {
              "group": "API Reference",
              "openapi": "/openapi.json",
              "pages": [
                "GET /users",
                "POST /users",
                "DELETE /users/{id}"
              ]
            }
          ]
        }
      }
    };
    
    setJsonInput(JSON.stringify(examples[example], null, 2));
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mintlify docs.json Configuration Sandbox
        </h1>
        <p className="text-gray-600">
          Test and validate your Mintlify documentation configuration. Edit the JSON on the left and see real-time validation and preview on the right.
        </p>
      </div>

      {/* Example Buttons */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => loadExample('minimal')}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Minimal Example
        </button>
        <button
          onClick={() => loadExample('complete')}
          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
        >
          Complete Example
        </button>
        <button
          onClick={() => loadExample('api')}
          className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
        >
          API Documentation Example
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Configuration Editor</h2>
          </div>
          
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-96 p-4 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your docs.json configuration here..."
          />

          {/* Validation Results */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Validation Results</h3>
            {renderValidation()}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Live Preview</h2>
            </div>
          </div>

          <div className="border rounded-lg bg-gray-50 min-h-96">
            {renderPreview()}
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">Quick Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Required Fields</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• <code>theme</code> - mint, maple, palm, willow, linden, almond, aspen</li>
              <li>• <code>name</code> - Your documentation site name</li>
              <li>• <code>colors.primary</code> - Hex color code (e.g., #ff0000)</li>
              <li>• <code>navigation</code> - Site navigation structure</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Optional Fields</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• <code>$schema</code> - For IDE autocomplete</li>
              <li>• <code>description</code> - For SEO and AI indexing</li>
              <li>• <code>logo</code> - Site logo configuration</li>
              <li>• <code>favicon</code> - Site favicon</li>
              <li>• <code>integrations</code> - Analytics and other services</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsJsonSandbox;
