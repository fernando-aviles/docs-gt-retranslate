import { useState, useEffect } from 'react'

export const DocsJsonSandbox = () => {
  const [jsonInput, setJsonInput] = useState('')
  const [validationResult, setValidationResult] = useState(null)
  const [parsedConfig, setParsedConfig] = useState(null)

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
  }

  useEffect(() => {
    setJsonInput(JSON.stringify(defaultConfig, null, 2))
  }, [])

  // Validation function
  const validateDocsJson = (config) => {
    const errors = []
    const warnings = []

    // Required fields validation
    if (!config.theme) {
      errors.push("'theme' is required. Must be one of: mint, maple, palm, willow, linden, almond, aspen")
    } else {
      const validThemes = ['mint', 'maple', 'palm', 'willow', 'linden', 'almond', 'aspen']
      if (!validThemes.includes(config.theme)) {
        errors.push(`Invalid theme '${config.theme}'. Must be one of: ${validThemes.join(', ')}`)
      }
    }

    if (!config.name) {
      errors.push("'name' is required. This is the name of your project, organization, or product")
    }

    if (!config.colors || !config.colors.primary) {
      errors.push("'colors.primary' is required. Must be a hex color code starting with #")
    } else if (config.colors.primary && !config.colors.primary.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.push("'colors.primary' must be a valid hex color code (e.g., #ff0000)")
    }

    if (!config.navigation) {
      errors.push("'navigation' is required. Define your documentation structure")
    } else {
      // Validate navigation structure
      if (config.navigation.groups) {
        config.navigation.groups.forEach((group, index) => {
          if (!group.group) {
            errors.push(`Navigation group at index ${index} is missing 'group' property`)
          }
          if (!group.pages || !Array.isArray(group.pages)) {
            errors.push(`Navigation group '${group.group}' is missing 'pages' array`)
          }
          
          // Check for reserved paths
          if (group.pages) {
            group.pages.forEach(page => {
              if (typeof page === 'string') {
                const pathParts = page.split('/')
                if (pathParts.includes('mcp')) {
                  warnings.push(`Page '${page}' uses reserved path. /mcp paths are reserved and may cause 404 errors`)
                }
              }
            })
          }
        })
      }

      if (config.navigation.tabs) {
        config.navigation.tabs.forEach((tab, index) => {
          if (!tab.name) {
            errors.push(`Navigation tab at index ${index} is missing 'name' property`)
          }
          if (!tab.url) {
            errors.push(`Navigation tab '${tab.name}' is missing 'url' property`)
          }
        })
      }
    }

    // Optional field validation
    if (config.colors) {
      ['light', 'dark'].forEach(mode => {
        if (config.colors[mode] && !config.colors[mode].match(/^#[0-9A-Fa-f]{6}$/)) {
          errors.push(`'colors.${mode}' must be a valid hex color code (e.g., #ff0000)`)
        }
      })
    }

    // Best practices warnings
    if (!config.$schema) {
      warnings.push('Consider adding "$schema": "https://mintlify.com/docs.json" for better IDE support.')
    }

    if (!config.description) {
      warnings.push('Consider adding a "description" for better SEO and AI indexing.')
    }

    return { errors, warnings, isValid: errors.length === 0 }
  }

  useEffect(() => {
    if (!jsonInput.trim()) {
      setValidationResult(null)
      setParsedConfig(null)
      return
    }

    try {
      const parsed = JSON.parse(jsonInput)
      setParsedConfig(parsed)
      const validation = validateDocsJson(parsed)
      setValidationResult(validation)
    } catch (error) {
      setValidationResult({
        errors: [`JSON Parse Error: ${error.message}`],
        warnings: [],
        isValid: false
      })
      setParsedConfig(null)
    }
  }, [jsonInput])

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
    }
    
    setJsonInput(JSON.stringify(examples[example], null, 2))
  }

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log('Copied to clipboard!')
      })
      .catch((err) => {
        console.error('Failed to copy: ', err)
      })
  }

  return (
    <div className="p-4 border dark:border-white/10 rounded-2xl not-prose">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <rect x="4" y="6" width="16" height="16" rx="2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l-2 2 2 2M15 12l2 2-2 2" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            Sandbox
          </h2>
          <p className="text-sm text-zinc-950/70 dark:text-white/70">
            Test and validate your <code>docs.json</code> configuration.
          </p>
        </div>

        {/* Example Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <button
              onClick={() => loadExample('minimal')}
              className="w-full px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors dark:bg-blue-900/30 dark:text-blue-300 font-medium"
            >
              Minimal example
            </button>
            <p className="text-xs text-zinc-950/60 dark:text-white/60 mt-1">
              Basic configuration with only required fields.
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={() => loadExample('complete')}
              className="w-full px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors dark:bg-green-900/30 dark:text-green-300 font-medium"
            >
              Complete example
            </button>
            <p className="text-xs text-zinc-950/60 dark:text-white/60 mt-1">
              Full-featured example.
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={() => loadExample('api')}
              className="w-full px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors dark:bg-purple-900/30 dark:text-purple-300 font-medium"
            >
              API documentation example
            </button>
            <p className="text-xs text-zinc-950/60 dark:text-white/60 mt-1">
              API-focused configuration with OpenAPI integration.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-zinc-950 dark:text-white">Editor</h3>
              <button
                onClick={() => copyToClipboard(jsonInput)}
                className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Copy JSON
              </button>
            </div>
            
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-80 p-3 border dark:border-white/10 rounded-lg font-mono text-xs resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white"
              placeholder="Enter your docs.json configuration here..."
            />
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <h3 className="font-medium text-zinc-950 dark:text-white">Preview</h3>
            
            {/* Validation Results */}
            <div className="space-y-2">
              {validationResult?.isValid && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs">
                  <span className="text-green-700 dark:text-green-300 font-medium">Valid <code>docs.json</code> configuration.</span>
                </div>
              )}

              {validationResult?.errors?.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-red-700 dark:text-red-400">
                    Errors ({validationResult.errors.length})
                  </h4>
                  {validationResult.errors.map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  ))}
                </div>
              )}

              {validationResult?.warnings?.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                    Warnings ({validationResult.warnings.length})
                  </h4>
                  {validationResult.warnings.map((warning, index) => (
                    <div key={index} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-300">
                      {warning}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Configuration Preview */}
            {parsedConfig && validationResult?.isValid && (
              <div className="space-y-3">
                {/* Site Header Preview */}
                <div className="border dark:border-white/10 rounded-lg overflow-hidden">
                  <div 
                    className="p-3 text-white text-xs"
                    style={{ backgroundColor: parsedConfig.colors?.primary || '#0066cc' }}
                  >
                    <div className="font-semibold">{parsedConfig.name}</div>
                    {parsedConfig.description && (
                      <div className="opacity-90 mt-1">{parsedConfig.description}</div>
                    )}
                  </div>
                </div>

                {/* Theme Info */}
                <div className="border dark:border-white/10 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-zinc-950 dark:text-white mb-2">Theme Configuration</h4>
                  <div className="space-y-1 text-xs text-zinc-950/70 dark:text-white/70">
                    <div><strong>Theme:</strong> {parsedConfig.theme}</div>
                    <div className="flex items-center gap-2">
                      <strong>Primary Color:</strong>
                      <span 
                        className="inline-block w-3 h-3 rounded border dark:border-white/20"
                        style={{ backgroundColor: parsedConfig.colors?.primary }}
                      ></span>
                      <span className="font-mono">{parsedConfig.colors?.primary}</span>
                    </div>
                  </div>
                </div>

                {/* Navigation Preview */}
                {parsedConfig.navigation && (
                  <div className="border dark:border-white/10 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-zinc-950 dark:text-white mb-2">Navigation Structure</h4>
                    
                    {/* Tabs */}
                    {parsedConfig.navigation.tabs && (
                      <div className="mb-2">
                        <div className="text-xs text-zinc-950/70 dark:text-white/70 mb-1">Tabs:</div>
                        <div className="flex gap-1">
                          {parsedConfig.navigation.tabs.map((tab, index) => (
                            <div key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                              {tab.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Groups */}
                    {parsedConfig.navigation.groups && (
                      <div className="space-y-2">
                        <div className="text-xs text-zinc-950/70 dark:text-white/70">Groups:</div>
                        {parsedConfig.navigation.groups.map((group, index) => (
                          <div key={index} className="border-l-2 border-zinc-200 dark:border-zinc-700 pl-2">
                            <div className="text-xs font-medium text-zinc-950 dark:text-white">{group.group}</div>
                            {group.pages && (
                              <div className="mt-1 space-y-0.5">
                                {group.pages.map((page, pageIndex) => (
                                  <div key={pageIndex} className="text-xs text-zinc-950/70 dark:text-white/70 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-zinc-400 rounded-full"></span>
                                    {typeof page === 'string' ? page : page.toString()}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Reference */}
        <div className="border-t dark:border-white/10 pt-4">
          <h4 className="text-sm font-medium text-zinc-950 dark:text-white mb-2">Quick Reference</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-medium text-zinc-950/80 dark:text-white/80 mb-1">Required Fields</div>
              <ul className="space-y-0.5 text-zinc-950/70 dark:text-white/70">
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">theme</code> - mint, maple, palm, willow, linden, almond, aspen</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">name</code> - Your documentation site name</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">colors.primary</code> - Hex color code (e.g., #ff0000)</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">navigation</code> - Site navigation structure</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-zinc-950/80 dark:text-white/80 mb-1">Optional Fields</div>
              <ul className="space-y-0.5 text-zinc-950/70 dark:text-white/70">
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">$schema</code> - For IDE autocomplete</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">description</code> - For SEO and AI indexing</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">logo</code> - Site logo configuration</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">favicon</code> - Site favicon</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
