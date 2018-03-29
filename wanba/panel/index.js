// panel/index.js, this filename needs to match the one registered in package.json
Editor.Panel.extend({
  // css style for panel
  style: `
    :host { margin: 5px; }
    h2 { color: #f90; }
  `,

  // html template for panel
  template: `
    <h2>wanba</h2>
    <form action="/demo/demo_form.asp">
    版本号:
    <ui-input id="version">0.0.0</ui-input>
    </form> 
    <form action="/demo/demo_form.asp">
    加密串:
    <ui-input id="xxteaKey">wanba_xiangbudao</ui-input>
    </form>
    <form action="/demo/demo_form.asp">
    发布版本(v2|v3)
    <ui-num-input id="creator_version" step="1" min="2" max="3">2</ui-num-input>
    </form>
    <form action="/demo/demo_form.asp">
    creator_v2_path:
    <ui-input id="creator_v2_path"></ui-input>
    </form>
    <form action="/demo/demo_form.asp">
    creator_v3_path:
    <ui-input id="creator_v3_path"></ui-input>
    </form>
    <form action="/demo/demo_form.asp">
    ndk_path:
    <ui-input id="ndk_path"></ui-input>
    </form>
    <ui-button id="build">生成游戏到build</ui-button>
    <ui-button id="build_android">生成游戏到android工程</ui-button>
    <ui-button id="repleace_android">快速替换android内游戏</ui-button>
    <ui-button id="package_project">快速生成发布包</ui-button>
    <ui-button id="open_current_folder">打开本工程文件夹</ui-button>
  `,

  // element and variable binding
  $: {
    version: '#version',
    xxteaKey: '#xxteaKey',
    creator_version: '#creator_version',
    creator_v2_path: '#creator_v2_path',
    creator_v3_path: '#creator_v3_path',
    ndk_path: '#ndk_path',
    build_android: '#build_android',
    build: '#build',
    repleace_android: '#repleace_android',
    package_project: '#package_project',
    open_current_folder: '#open_current_folder'
  },



  // method executed when template and styles are successfully loaded and initialized
  ready() {
    this.$build.addEventListener('confirm', () => {
      this.sendCommond('wanba:build');
    });

    this.$build_android.addEventListener('confirm', () => {
      this.sendCommond('wanba:build_android');
    });

    this.$repleace_android.addEventListener('confirm', () => {
      this.sendCommond('wanba:repleace_android');
    });

    this.$package_project.addEventListener('confirm', () => {
      this.sendCommond('wanba:package_project');
    });

    this.$open_current_folder.addEventListener('confirm', () => {
      Editor.Ipc.sendToMain('wanba:open_current_folder');
    });

    Editor.Ipc.sendToMain('wanba:init_panel_data');
  },

  getParam(){
    let buildParam = {
      version : this.$version.value,
      xxteaKey : this.$xxteaKey.value,
      creator_version : this.$creator_version.value,
      creator_path :{
        2:this.$creator_v2_path.value,
        3:this.$creator_v3_path.value
      },
      ndk_path:this.$ndk_path.value,
    }
    return buildParam;
  },

  close(){
    Editor.log("close_panel");
    Editor.Ipc.sendToMain('wanba:close_panel',this.getParam());
  },

  sendCommond(commond) {
    let buildParam = this.getParam();
    if ( parseInt(buildParam.creator_version) < 2) {
      Editor.log("creator_version is error, please check");
      return;
    }

    Editor.log("build 参数是:", JSON.stringify(buildParam));
    Editor.Ipc.sendToMain(commond, buildParam);
  },

  messages: {
    'wanba:init_panel_config'(event, args) {
      this.$version.value = args.version;
      this.$xxteaKey.value = args.xxteaKey;
      this.$creator_version.value = args.creator_version;
      this.$ndk_path.value = args.ndk_path;
      if (args.creator_path[2]) {
        this.$creator_v2_path.value = args.creator_path[2];
      }
      if (args.creator_path[3]) {
        this.$creator_v3_path.value = args.creator_path[3];
      }
    },
  }

});