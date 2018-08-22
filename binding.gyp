{
  'variables': {
    'platform': '<(OS)',
  },
  'conditions': [
    # Replace gyp platform with node platform, blech
    ['platform == "mac"', {'variables': {'platform': 'darwin'}}],
    ['platform == "win"', {'variables': {'platform': 'win32'}}],
  ],
  'targets': [
    {
      'target_name': 'openvr',
      'defines': [
        'VERSION=1.0.16',
        'TEST_METHODS'
      ],
      'sources': [
        'src/bindings.cpp',
        'src/ivrsystem.cpp',
        'src/ivrcompositor.cpp',
        'src/ivroverlay.cpp',
        'src/openvr.cpp'
      ],
      'include_dirs': [
        "<!(node -e \"require('nan')\")",
        '<(module_root_dir)/lib/openvr/headers',
      ],
      'conditions': [
        ['OS=="linux"', {
          'library_dirs': ['<(module_root_dir)/lib/openvr/lib/linux64'],
          'libraries': ['<(module_root_dir)/lib/openvr/lib/linux64/libopenvr_api.so'],
          'copies':
          [
            {
              'destination': '<(module_root_dir)/build/Release',
              'files': ['<(module_root_dir)/lib/openvr/bin/linux64/libopenvr_api.so']
            }
          ],
        }],
        ['OS=="mac"', {
          'library_dirs': ['<(module_root_dir)/lib/openvr/lib/osx32'],
          'libraries': ['libopenvr_api.dylib'],
          'copies':
          [
            {
              'destination': '<(module_root_dir)/build/Release',
              'files': ['<(module_root_dir)/lib/openvr/bin/osx32/libopenvr_api.dylib']
            }
          ],
        }],
        ['OS=="win"', {
          'library_dirs': ['<(module_root_dir)/lib/openvr/lib/win64'],
          'libraries': ['openvr_api.lib'],
          'defines' : ['WIN32_LEAN_AND_MEAN', 'VC_EXTRALEAN', 'NOMINMAX'],
          'msvs_settings' : {
            'VCCLCompilerTool' : {
              'AdditionalOptions' : ['/std:c++17','/O2','/Oy','/GL','/GF','/Gm-','/EHsc','/MT','/GS','/Gy','/GR-','/Gd']
            },
            'VCLinkerTool' : {
              'AdditionalOptions' : ['/OPT:REF','/OPT:ICF','/LTCG']
            },
          },
          'copies':
          [
            {
              'destination': '<(module_root_dir)/build/Release',
              'files': ['<(module_root_dir)/lib/openvr/bin/win64/openvr_api.dll']
            }
          ],
        }],
      ],
    }
  ]
}
