import { useState, useEffect, useMemo, useCallback } from 'react'

export const DocsJsonSandbox = () => {
  const [jsonInput, setJsonInput] = useState('')

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

  // Memoized helper function to recursively check navigation paths for reserved words
  const checkNavigationPaths = useCallback((items, warnings, context = '') => {
    if (!Array.isArray(items)) return
    
    items.forEach((item) => {
      if (typeof item === 'string') {
        // Direct page path
        const pathParts = item.split('/')
        if (pathParts.includes('mcp')) {
          warnings.push(`${context} page '${item}' uses reserved path. /mcp paths are reserved and may cause 404 errors`)
        }
      } else if (typeof item === 'object' && item !== null) {
        // Check nested navigation structures
        if (item.pages) {
          checkNavigationPaths(item.pages, warnings, context || `Navigation item '${item.group || item.item || item.tab || item.anchor || item.dropdown}'`)
        }
        if (item.groups) {
          checkNavigationPaths(item.groups, warnings, context)
        }
        if (item.menu) {
          checkNavigationPaths(item.menu, warnings, context || `Tab '${item.tab}'`)
        }
        if (item.href && typeof item.href === 'string') {
          // Check href paths (only relative paths)
          if (!item.href.startsWith('http')) {
            const pathParts = item.href.split('/')
            if (pathParts.includes('mcp')) {
              warnings.push(`${context} href '${item.href}' uses reserved path. /mcp paths are reserved and may cause 404 errors`)
            }
          }
        }
      }
    })
  }, [])

  // Memoized helper function to render navigation items recursively
  const renderNavigationItems = useCallback((items, depth = 0) => {
    if (!Array.isArray(items)) return null
    
    return items.map((item, index) => {
      const marginLeft = depth * 12
      
      if (typeof item === 'string') {
        // Direct page
        return (
          <div key={index} className="text-xs text-zinc-950/70 dark:text-white/70 flex items-center gap-1" style={{ marginLeft: `${marginLeft}px` }}>
            <span className="w-1 h-1 bg-zinc-400 rounded-full"></span>
            {item}
          </div>
        )
      } else if (typeof item === 'object' && item !== null) {
        // Navigation structure (group, tab, anchor, etc.)
        const title = item.group || item.tab || item.anchor || item.dropdown || item.item || 'Unknown'
        const isGroup = item.group
        const isTab = item.tab
        const isAnchor = item.anchor
        const isDropdown = item.dropdown
        const isMenuItem = item.item
        
        return (
          <div key={index} style={{ marginLeft: `${marginLeft}px` }}>
            <div className={`text-xs font-medium flex items-center gap-1 mb-1 ${
              isGroup ? 'text-zinc-950 dark:text-white' :
              isTab ? 'text-blue-700 dark:text-blue-300' :
              isAnchor ? 'text-indigo-700 dark:text-indigo-300' :
              isDropdown ? 'text-orange-700 dark:text-orange-300' :
              isMenuItem ? 'text-gray-700 dark:text-gray-300' :
              'text-zinc-950 dark:text-white'
            }`}>
              {isGroup && '📁'}
              {isTab && '📋'}
              {isAnchor && '⚓'}
              {isDropdown && '▼'}
              {isMenuItem && '📄'}
              {title}
              {item.icon && <span className="text-zinc-500">({item.icon})</span>}
            </div>
            
            {/* Render nested pages */}
            {item.pages && (
              <div className="space-y-0.5">
                {renderNavigationItems(item.pages, depth + 1)}
              </div>
            )}
            
            {/* Render nested groups */}
            {item.groups && (
              <div className="space-y-1">
                {renderNavigationItems(item.groups, depth + 1)}
              </div>
            )}
            
            {/* Render menu items */}
            {item.menu && (
              <div className="space-y-1">
                {renderNavigationItems(item.menu, depth + 1)}
              </div>
            )}
            
            {/* Show href for external links */}
            {item.href && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400" style={{ marginLeft: `${(depth + 1) * 12}px` }}>
                → {item.href}
              </div>
            )}
          </div>
        )
      }
      
      return null
    })
  }, [])

  // Memoized validation helper functions
  const validateRequiredFields = useCallback((config, errors) => {
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
  }, [])

  const validateColors = useCallback((config, errors) => {
    if (!config.colors || !config.colors.primary) {
      errors.push("'colors.primary' is required. Must be a hex color code starting with #")
    } else if (config.colors.primary && !config.colors.primary.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.push("'colors.primary' must be a valid hex color code (e.g., #ff0000)")
    }

    // Optional color validation
    if (config.colors) {
      ['light', 'dark'].forEach(mode => {
        if (config.colors[mode] && !config.colors[mode].match(/^#[0-9A-Fa-f]{6}$/)) {
          errors.push(`'colors.${mode}' must be a valid hex color code (e.g., #ff0000)`)
        }
      })
    }
  }, [])

  const validateNavigation = useCallback((config, errors, warnings) => {
    if (!config.navigation) {
      errors.push("'navigation' is required. Define your documentation structure")
      return
    }

    // Check for reserved paths in all navigation types
    if (config.navigation.pages) {
      checkNavigationPaths(config.navigation.pages, warnings, 'Root navigation')
    }
    
    if (config.navigation.groups) {
      config.navigation.groups.forEach((group, index) => {
        if (!group.group) {
          errors.push(`Navigation group at index ${index} is missing 'group' property`)
        }
        if (!group.pages || !Array.isArray(group.pages)) {
          errors.push(`Navigation group '${group.group}' is missing 'pages' array`)
        }
      })
      checkNavigationPaths(config.navigation.groups, warnings)
    }

    // Validate tabs
    if (config.navigation.tabs) {
      config.navigation.tabs.forEach((tab, index) => {
        if (!tab.tab) {
          errors.push(`Navigation tab at index ${index} is missing 'tab' property`)
        }
        // Validate menu items within tabs
        if (tab.menu) {
          tab.menu.forEach((menuItem, menuIndex) => {
            if (!menuItem.item) {
              errors.push(`Menu item at index ${menuIndex} in tab '${tab.tab}' is missing 'item' property`)
            }
          })
        }
      })
      checkNavigationPaths(config.navigation.tabs, warnings)
    }
    
    // Validate anchors
    if (config.navigation.anchors) {
      config.navigation.anchors.forEach((anchor, index) => {
        if (!anchor.anchor) {
          errors.push(`Navigation anchor at index ${index} is missing 'anchor' property`)
        }
      })
      checkNavigationPaths(config.navigation.anchors, warnings)
    }
    
    // Validate dropdowns
    if (config.navigation.dropdowns) {
      config.navigation.dropdowns.forEach((dropdown, index) => {
        if (!dropdown.dropdown) {
          errors.push(`Navigation dropdown at index ${index} is missing 'dropdown' property`)
        }
      })
      checkNavigationPaths(config.navigation.dropdowns, warnings)
    }
    
    // Validate versions
    if (config.navigation.versions) {
      config.navigation.versions.forEach((version, index) => {
        if (!version.version) {
          errors.push(`Navigation version at index ${index} is missing 'version' property`)
        }
        if (version.pages) checkNavigationPaths(version.pages, warnings, `Version '${version.version}'`)
        if (version.groups) checkNavigationPaths(version.groups, warnings, `Version '${version.version}'`)
        if (version.tabs) checkNavigationPaths(version.tabs, warnings, `Version '${version.version}'`)
        if (version.anchors) checkNavigationPaths(version.anchors, warnings, `Version '${version.version}'`)
        if (version.dropdowns) checkNavigationPaths(version.dropdowns, warnings, `Version '${version.version}'`)
      })
    }
    
    // Validate languages
    if (config.navigation.languages) {
      const validLanguages = ['ar', 'cn', 'zh-Hant', 'en', 'fr', 'de', 'id', 'it', 'jp', 'ko', 'pt-BR', 'ru', 'es', 'tr']
      config.navigation.languages.forEach((language, index) => {
        if (!language.language) {
          errors.push(`Navigation language at index ${index} is missing 'language' property`)
        } else if (!validLanguages.includes(language.language)) {
          warnings.push(`Language code '${language.language}' may not be supported. Supported codes: ${validLanguages.join(', ')}`)
        }
        if (language.pages) checkNavigationPaths(language.pages, warnings, `Language '${language.language}'`)
        if (language.groups) checkNavigationPaths(language.groups, warnings, `Language '${language.language}'`)
        if (language.tabs) checkNavigationPaths(language.tabs, warnings, `Language '${language.language}'`)
        if (language.anchors) checkNavigationPaths(language.anchors, warnings, `Language '${language.language}'`)
        if (language.dropdowns) checkNavigationPaths(language.dropdowns, warnings, `Language '${language.language}'`)
      })
    }
    
    // Validate global anchors
    if (config.navigation.global?.anchors) {
      config.navigation.global.anchors.forEach((anchor, index) => {
        if (!anchor.anchor) {
          errors.push(`Global anchor at index ${index} is missing 'anchor' property`)
        }
        if (!anchor.href) {
          errors.push(`Global anchor '${anchor.anchor}' is missing 'href' property`)
        } else if (!anchor.href.startsWith('http')) {
          errors.push(`Global anchor '${anchor.anchor}' href must be an external URL starting with http/https`)
        }
      })
      checkNavigationPaths(config.navigation.global.anchors, warnings, 'Global anchors')
    }
  }, [checkNavigationPaths])

  const validateAssets = useCallback((config, warnings) => {
    // Logo validation
    if (config.logo) {
      if (typeof config.logo === 'object') {
        if (config.logo.href && !config.logo.href.match(/^https?:\/\//)) {
          warnings.push("Logo 'href' should be a complete URL starting with http:// or https://")
        }
      }
    }

    // Favicon validation
    if (config.favicon && !config.favicon.match(/\.(ico|png|svg)$/i)) {
      warnings.push("Favicon should typically be an .ico, .png, or .svg file")
    }
  }, [])

  const validateIntegrations = useCallback((config, warnings) => {
    if (!config.integrations) return

    if (config.integrations.ga4 && config.integrations.ga4.measurementId) {
      if (!config.integrations.ga4.measurementId.match(/^G-[A-Z0-9]+$/)) {
        warnings.push("Google Analytics 4 measurement ID should follow format 'G-XXXXXXXXX'")
      }
    }
    if (config.integrations.gtm && config.integrations.gtm.containerId) {
      if (!config.integrations.gtm.containerId.match(/^GTM-[A-Z0-9]+$/)) {
        warnings.push("Google Tag Manager container ID should follow format 'GTM-XXXXXXX'")
      }
    }
  }, [])

  const validateBestPractices = useCallback((config, warnings) => {
    if (!config.$schema) {
      warnings.push('Consider adding "$schema": "https://mintlify.com/docs.json" for better IDE support.')
    }

    if (!config.description) {
      warnings.push('Consider adding a "description" for better SEO and AI indexing.')
    }

    if (!config.favicon) {
      warnings.push('Consider adding a "favicon" for better branding.')
    }

    if (!config.logo) {
      warnings.push('Consider adding a "logo" configuration for better branding.')
    }
  }, [])

  // Memoized main validation orchestrator function
  const validateDocsJson = useCallback((config) => {
    const errors = []
    const warnings = []

    // Run all validation checks
    validateRequiredFields(config, errors)
    validateColors(config, errors)
    validateNavigation(config, errors, warnings)
    validateAssets(config, warnings)
    validateIntegrations(config, warnings)
    validateBestPractices(config, warnings)

    return { errors, warnings, isValid: errors.length === 0 }
  }, [validateRequiredFields, validateColors, validateNavigation, validateAssets, validateIntegrations, validateBestPractices])

  // Memoize parsed config to avoid re-parsing same JSON
  const parsedConfig = useMemo(() => {
    if (!jsonInput.trim()) return null
    
    try {
      return JSON.parse(jsonInput)
    } catch (error) {
      return null
    }
  }, [jsonInput])

  // Memoize validation result to avoid re-validating same config
  const validationResult = useMemo(() => {
    if (!jsonInput.trim()) return null
    if (!parsedConfig) {
      return {
        errors: [`JSON Parse Error: Invalid JSON format`],
        warnings: [],
        isValid: false
      }
    }
    
    return validateDocsJson(parsedConfig)
  }, [parsedConfig, validateDocsJson])

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
          "pages": [
            "introduction",
            "quickstart"
          ]
        }
      },
      complete: {
        "$schema": "https://mintlify.com/docs.json",
        "theme": "maple",
        "name": "Complete Documentation",
        "description": "Comprehensive documentation site with all navigation features",
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
          "global": {
            "anchors": [
              {
                "anchor": "Community",
                "icon": "users",
                "href": "https://discord.gg/example"
              },
              {
                "anchor": "Blog",
                "icon": "newspaper",
                "href": "https://example.com/blog"
              }
            ]
          },
          "versions": [
            {
              "version": "2.0",
              "groups": [
                {
                  "group": "Getting Started",
                  "icon": "play",
                  "pages": [
                    "v2/introduction",
                    "v2/quickstart"
                  ]
                }
              ]
            },
            {
              "version": "1.0",
              "groups": [
                {
                  "group": "Getting Started",
                  "pages": [
                    "v1/introduction",
                    "v1/quickstart"
                  ]
                }
              ]
            }
          ],
          "tabs": [
            {
              "tab": "Documentation",
              "groups": [
                {
                  "group": "Getting Started",
                  "icon": "play",
                  "pages": [
                    "introduction",
                    "quickstart",
                    "installation"
                  ]
                },
                {
                  "group": "Advanced",
                  "icon": "cog",
                  "pages": [
                    "advanced/configuration",
                    "advanced/customization"
                  ]
                }
              ]
            },
            {
              "tab": "API Reference",
              "menu": [
                {
                  "item": "Authentication",
                  "icon": "key",
                  "pages": [
                    "api/auth/overview",
                    "api/auth/tokens"
                  ]
                },
                {
                  "item": "Endpoints",
                  "icon": "globe",
                  "groups": [
                    {
                      "group": "Users",
                      "pages": [
                        "GET /users",
                        "POST /users",
                        "DELETE /users/{id}"
                      ]
                    }
                  ]
                }
              ]
            }
          ],
          "anchors": [
            {
              "anchor": "Help Center",
              "icon": "question-mark-circle",
              "pages": [
                "help/faq",
                "help/troubleshooting"
              ]
            }
          ],
          "dropdowns": [
            {
              "dropdown": "Resources",
              "icon": "book-open",
              "pages": [
                "resources/examples",
                "resources/templates"
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
        "description": "RESTful API documentation with OpenAPI integration",
        "colors": {
          "primary": "#8B5CF6"
        },
        "navigation": {
          "anchors": [
            {
              "anchor": "API Reference",
              "icon": "code",
              "groups": [
                {
                  "group": "Authentication",
                  "icon": "key",
                  "pages": [
                    "auth/overview",
                    "auth/api-keys",
                    "auth/oauth"
                  ]
                },
                {
                  "group": "Core API",
                  "icon": "server",
                  "openapi": "/openapi.json",
                  "pages": [
                    "GET /users",
                    "POST /users",
                    "PUT /users/{id}",
                    "DELETE /users/{id}",
                    "GET /projects",
                    "POST /projects"
                  ]
                }
              ]
            },
            {
              "anchor": "SDKs",
              "icon": "code",
              "groups": [
                {
                  "group": "Client Libraries",
                  "pages": [
                    "sdks/javascript",
                    "sdks/python",
                    "sdks/go"
                  ]
                }
              ]
            }
          ]
        }
      },
      multilingual: {
        "$schema": "https://mintlify.com/docs.json",
        "theme": "palm",
        "name": "Multilingual Documentation",
        "description": "Documentation site with multiple language support",
        "colors": {
          "primary": "#059669"
        },
        "navigation": {
          "languages": [
            {
              "language": "en",
              "groups": [
                {
                  "group": "Getting Started",
                  "pages": [
                    "en/introduction",
                    "en/quickstart"
                  ]
                }
              ]
            },
            {
              "language": "es",
              "groups": [
                {
                  "group": "Comenzando",
                  "pages": [
                    "es/introduccion",
                    "es/inicio-rapido"
                  ]
                }
              ]
            },
            {
              "language": "fr",
              "groups": [
                {
                  "group": "Commencer",
                  "pages": [
                    "fr/introduction",
                    "fr/demarrage-rapide"
                  ]
                }
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
            Test and validate your <code>docs.json</code> configuration. Start with one of the examples below or paste your <code>docs.json</code> into the editor.
          </p>
        </div>

        {/* Example Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <button
              onClick={() => loadExample('minimal')}
              className="w-full px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors dark:bg-blue-900/30 dark:text-blue-300 font-medium"
            >
              Minimal
            </button>
            <p className="text-xs text-zinc-950/60 dark:text-white/60 mt-1">
              Basic configuration with simple pages navigation.
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={() => loadExample('complete')}
              className="w-full px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors dark:bg-green-900/30 dark:text-green-300 font-medium"
            >
              Complete
            </button>
            <p className="text-xs text-zinc-950/60 dark:text-white/60 mt-1">
              Advanced setup with tabs, anchors, dropdowns, versions, and global links.
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={() => loadExample('api')}
              className="w-full px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors dark:bg-purple-900/30 dark:text-purple-300 font-medium"
            >
              API Docs
            </button>
            <p className="text-xs text-zinc-950/60 dark:text-white/60 mt-1">
              API documentation with anchors, groups, and OpenAPI integration.
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={() => loadExample('multilingual')}
              className="w-full px-3 py-2 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors dark:bg-emerald-900/30 dark:text-emerald-300 font-medium"
            >
              Multilingual
            </button>
            <p className="text-xs text-zinc-950/60 dark:text-white/60 mt-1">
              Multi-language documentation with language-specific navigation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <div className="flex flex-col space-y-4">
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
              className="w-full flex-1 p-3 border dark:border-white/10 rounded-lg font-mono text-xs resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white"
              placeholder="Enter your docs.json configuration here..."
            />
          </div>

          {/* Preview Panel */}
          <div className="flex flex-col space-y-4">
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
                    
                    {/* Versions */}
                    {parsedConfig.navigation.versions && (
                      <div className="mb-3">
                        <div className="text-xs text-zinc-950/70 dark:text-white/70 mb-1">Versions:</div>
                        <div className="flex gap-1 flex-wrap">
                          {parsedConfig.navigation.versions.map((version, index) => (
                            <div key={index} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                              v{version.version}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {parsedConfig.navigation.languages && (
                      <div className="mb-3">
                        <div className="text-xs text-zinc-950/70 dark:text-white/70 mb-1">Languages:</div>
                        <div className="flex gap-1 flex-wrap">
                          {parsedConfig.navigation.languages.map((language, index) => (
                            <div key={index} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                              {language.language}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Global Anchors */}
                    {parsedConfig.navigation.global?.anchors && (
                      <div className="mb-3">
                        <div className="text-xs text-zinc-950/70 dark:text-white/70 mb-1">Global Anchors:</div>
                        <div className="space-y-1">
                          {parsedConfig.navigation.global.anchors.map((anchor, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                                {anchor.anchor}
                              </span>
                              <span className="text-zinc-950/50 dark:text-white/50">→ {anchor.href}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Complete Navigation Hierarchy */}
                    <div className="space-y-3">
                      {/* Tabs */}
                      {parsedConfig.navigation.tabs && (
                        <div>
                          <div className="text-xs text-zinc-950/70 dark:text-white/70 mb-2 font-medium">Tabs:</div>
                          <div className="space-y-1">
                            {renderNavigationItems(parsedConfig.navigation.tabs)}
                          </div>
                        </div>
                      )}

                      {/* Anchors */}
                      {parsedConfig.navigation.anchors && (
                        <div>
                          <div className="text-xs text-zinc-950/70 dark:text-white/70 mb-2 font-medium">Anchors:</div>
                          <div className="space-y-1">
                            {renderNavigationItems(parsedConfig.navigation.anchors)}
                          </div>
                        </div>
                      )}

                      {/* Dropdowns */}
                      {parsedConfig.navigation.dropdowns && (
                        <div>
                          <div className="text-xs text-zinc-950/70 dark:text-white/70 mb-2 font-medium">Dropdowns:</div>
                          <div className="space-y-1">
                            {renderNavigationItems(parsedConfig.navigation.dropdowns)}
                          </div>
                        </div>
                      )}

                      {/* Groups */}
                      {parsedConfig.navigation.groups && (
                        <div>
                          <div className="text-xs text-zinc-950/70 dark:text-white/70 mb-2 font-medium">Groups:</div>
                          <div className="space-y-1">
                            {renderNavigationItems(parsedConfig.navigation.groups)}
                          </div>
                        </div>
                      )}

                      {/* Root Pages */}
                      {parsedConfig.navigation.pages && (
                        <div>
                          <div className="text-xs text-zinc-950/70 dark:text-white/70 mb-2 font-medium">Root Pages:</div>
                          <div className="space-y-1">
                            {renderNavigationItems(parsedConfig.navigation.pages)}
                          </div>
                        </div>
                      )}

                      {/* Version-specific navigation */}
                      {parsedConfig.navigation.versions && (
                        <div>
                          <div className="text-xs text-zinc-950/70 dark:text-white/70 mb-2 font-medium">Version Navigation:</div>
                          {parsedConfig.navigation.versions.map((version, index) => (
                            <div key={index} className="mb-2">
                              <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                                📚 Version {version.version}
                              </div>
                              <div className="space-y-1">
                                {version.pages && renderNavigationItems(version.pages, 1)}
                                {version.groups && renderNavigationItems(version.groups, 1)}
                                {version.tabs && renderNavigationItems(version.tabs, 1)}
                                {version.anchors && renderNavigationItems(version.anchors, 1)}
                                {version.dropdowns && renderNavigationItems(version.dropdowns, 1)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Language-specific navigation */}
                      {parsedConfig.navigation.languages && (
                        <div>
                          <div className="text-xs text-zinc-950/70 dark:text-white/70 mb-2 font-medium">Language Navigation:</div>
                          {parsedConfig.navigation.languages.map((language, index) => (
                            <div key={index} className="mb-2">
                              <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                                🌍 {language.language.toUpperCase()}
                              </div>
                              <div className="space-y-1">
                                {language.pages && renderNavigationItems(language.pages, 1)}
                                {language.groups && renderNavigationItems(language.groups, 1)}
                                {language.tabs && renderNavigationItems(language.tabs, 1)}
                                {language.anchors && renderNavigationItems(language.anchors, 1)}
                                {language.dropdowns && renderNavigationItems(language.dropdowns, 1)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Reference */}
        <div className="border-t dark:border-white/10 pt-4">
          <h4 className="text-sm font-medium text-zinc-950 dark:text-white mb-2">Quick Reference</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
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
              <div className="font-medium text-zinc-950/80 dark:text-white/80 mb-1">Navigation Types</div>
              <ul className="space-y-0.5 text-zinc-950/70 dark:text-white/70">
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">pages</code> - Simple page list</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">groups</code> - Organized sections</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">tabs</code> - Tabbed navigation</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">anchors</code> - Sidebar anchors</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">dropdowns</code> - Dropdown menus</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">versions</code> - Version selector</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">languages</code> - Multi-language</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-zinc-950/80 dark:text-white/80 mb-1">Optional Fields</div>
              <ul className="space-y-0.5 text-zinc-950/70 dark:text-white/70">
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">$schema</code> - For IDE autocomplete</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">description</code> - For SEO and AI indexing</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">logo</code> - Site logo configuration</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">favicon</code> - Site favicon</li>
                <li>• <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">integrations</code> - Analytics & tools</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
