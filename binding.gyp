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
        'VERSION=1.0.16'
      ],
      'sources': [
        'src/binding/bindings.cpp',
        'src/binding/ivrsystem.cpp',
        'src/binding/ivrcompositor.cpp',
        'src/binding/ivroverlay.cpp',
        'src/binding/openvr.cpp'
      ],
      'include_dirs': [
        "<!(node -e \"require('nan')\")",
        '<(module_root_dir)/lib/openvr/headers',
        '<(module_root_dir)/lib/glfw/include',
        '<(module_root_dir)/lib/openvr/samples/thirdparty/sdl2-2.0.3/include'
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
          'library_dirs': ['<(module_root_dir)/lib/openvr/lib/win64', '<(module_root_dir)/lib/glfw/lib-vc2015'],
          'libraries': ['openvr_api.lib', 'glfw3dll.lib', 'opengl32.lib'],
          'defines' : ['VC_EXTRALEAN', 'NOMINMAX'],
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
              'files': [
                '<(module_root_dir)/lib/openvr/bin/win64/openvr_api.dll',
                '<(module_root_dir)/lib/glfw/lib-vc2015/glfw3.dll',
              ]
            }
          ],
        }],
      ],
    }
  ]
}