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
    加密串:覆盖默认加密串:
    <ui-input id="xxteaKey">wanba_xiangbudao</ui-input>
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
    build_android: '#build_android',
    build: '#build',
    repleace_android: '#repleace_android',
    package_project: '#package_project',
    open_current_folder: '#open_current_folder'
  },



  // method executed when template and styles are successfully loaded and initialized
  ready() {
    this.$build_android.addEventListener('confirm', () => {
      this.sendCommond('wanba:build_android', this.$version.value, this.$xxteaKey.value);
    });

    this.$build.addEventListener('confirm', () => {
      this.sendCommond('wanba:build', this.$version.value, this.$xxteaKey.value);
    });

    this.$repleace_android.addEventListener('confirm', () => {
      this.sendCommond('wanba:repleace_android', this.$version.value, this.$xxteaKey.value);
    });

    this.$package_project.addEventListener('confirm', () => {
      this.sendCommond('wanba:package_project', this.$version.value, this.$xxteaKey.value);
    });

    this.$open_current_folder.addEventListener('confirm', () => {
      Editor.Ipc.sendToMain('wanba:open_current_folder');
    });
  },

  sendCommond(commond, version, xxteaKey) {
    if (version == "") {
      Editor.log("version is null, please check");
      return;
    }

    if (xxteaKey == "") {
      xxteaKey = "wanba_xiangbudao";
      Editor.log('xxteaKey = "", will use  defauld wanba_xiangbudao');
    }
    Editor.log("命令为:", commond, "Build的版本号为：", version, "加密串为：", xxteaKey);
    Editor.Ipc.sendToMain(commond, { version: version, xxteaKey: xxteaKey });
  }

});