'use strict';

//var fs = require('fs');

var wanba_game_out_path = "";
var wanba_game_publish_path
var wanba_game_name = "";
var targetPlatform = "";
var isDebug = true;
var suportEncryptJs = true;
var wanba_config_file = '';
var wanba_config = {
  version: "0.1",
  xxteaKey: "wanba_xiangbudao",
  creator_version: 2,
  creator_path: {},
  ndk_path: ""
};

module.exports = {

  load() {
    // execute when package loaded
    wanba_game_name = Editor.projectInfo.name;
    wanba_game_out_path = Editor.projectPath + "/../../build/" + wanba_game_name;
    wanba_game_publish_path = Editor.projectPath + "/../../publish/";
    var path = require('path');
    wanba_game_out_path = path.normalize(wanba_game_out_path);
    wanba_game_publish_path = path.normalize(wanba_game_publish_path);

    wanba_config_file = Editor.url('packages://wanba/config.json', 'utf8');
    this.initConfig();

    Editor.log('load wanba package success');
  },

  unload() {
    // execute when package unloaded
    Editor.log('unload wanba package success');
  },

  // register your ipc messages here
  messages: {
    'open'() {
      Editor.Panel.open('wanba');
    },

    'close_panel'(event, args) {
      wanba_config = args;
      this.saveConfig();
    },

    'init_panel_data'() {
      this.initPanel();
    },

    'build'(event, args) {
      // open entry panel registered in package.json
      if (this.checkBuildParam(args)) {
        targetPlatform = "ios";
        this.build();
      };
    },

    'build_android'(event, args) {
      // open entry panel registered in package.json
      if (this.checkBuildParam(args)) {
        // targetPlatform = "android";
        targetPlatform = "ios";
        this.buildAndroid();
      };
    },

    'repleace_android'(event, args) {
      // open entry panel registered in package.json
      if (this.checkBuildParam(args)) {
        targetPlatform = "android";
        this.repleaceAndroid();
      };
    },

    'package_project'(event, args) {
      if (this.checkBuildParam(args)) {
        targetPlatform = "ios";
        this.packageProject();
      };
    },

    'open_current_folder'() {
      this.openCurrentFolder();
    },

    'wanba:update_skin'() {
      this.updateSkin();
    },
  },

  initConfig() {
    let fs = require('fs');
    if (fs.existsSync(wanba_config_file)) {
      let tempData = fs.readFileSync(wanba_config_file, 'utf-8');
      wanba_config = JSON.parse(tempData);
    }
    Editor.log("current config is : \r\n", JSON.stringify(wanba_config));
  },

  saveConfig() {
    let fs = require('fs');
    fs.writeFileSync(wanba_config_file, JSON.stringify(wanba_config));
    Editor.log("配置保存成功，路径为:", wanba_config_file);
  },

  setCreatorPath(args) {
    let fs = require('fs');
    if (!args.creator_path || args.creator_path.indexOf("app") < 0 || !fs.existsSync(args.creator_path)) {
      Editor.log("creator路径不合法，请检查,", args.creator_path);
      return;
    }
    wanba_config.creator_path[args.creator_version] = args.creator_path;
    this.saveConfig();
  },

  setNdkPath(args) {
    let fs = require('fs');
    // if(!fs.existsSync(args.creator_path)){
    //   Editor.log("ndk路径设置错误：",args.ndk_path);
    //   return ;
    // }

    if (!args.ndk_path || args.ndk_path == "") {
      Editor.log("ndk路径设置错误：", args.ndk_path);
      return;
    }
    wanba_config.ndk_path = args.ndk_path;
    this.saveConfig();
  },

  getVersion() {
    return wanba_config.creator_version + "." + wanba_config.version;
  },

  initPanel() {
    // send ipc message to panel
    Editor.Ipc.sendToPanel('wanba', 'wanba:init_panel_config', wanba_config);
  },

  checkBuildParam(args) {
    wanba_config = args;
    suportEncryptJs = wanba_config.creator_version == 2 ? false : true;
    if (!wanba_config.creator_path[wanba_config.creator_version]) {
      Editor.error("还没设置对应版本的Creator的路径,请检查,version:", wanba_config.creator_version);
      return;
    }
    Editor.log("build 参数是:", JSON.stringify(wanba_config));
    this.createVersionFile();
    return true;
  },

  createVersionFile(args) {
    var path = require('path');
    let wanba_game_build = wanba_game_out_path + '/../';
    wanba_game_build = path.normalize(wanba_game_build);

    var fs = require('fs');
    if (!fs.existsSync(wanba_game_build)) {
      let res = fs.mkdirSync(wanba_game_build);
      Editor.log("create dir ", wanba_game_build);
    }

    if (!fs.existsSync(wanba_game_out_path)) {
      let res = fs.mkdirSync(wanba_game_out_path);
      Editor.log("create dir ", wanba_game_out_path);
    }

    //生成version
    let versionPath = wanba_game_out_path + "/version.json";
    let versionStr = '{\r\n    "version": "{version}",\r\n    "gameName": "{gameName}"\r\n}';
    versionStr = versionStr.replace(/{version}/g, this.getVersion());
    versionStr = versionStr.replace(/{gameName}/g, wanba_game_name);

    //创建vserion
    fs.writeFileSync(versionPath, versionStr);
    Editor.log("create version file success", versionPath);
  },

  excCommondAsync: function (command) {
    Editor.log("开始执行命令:", command);
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
      exec(command, { env: process.env }, (error, stdout, stderr) => {
        if (error) {
          reject(stderr);
          Editor.log("执行命令完成，error", stderr);
        } else {
          resolve(stdout);
          Editor.log("执行命令完成，succes", stdout);
        }
      });
    });
  },

  async buildProject() {
    let commonStr = wanba_config.creator_path[wanba_config.creator_version];
    commonStr += "/Contents/MacOS/CocosCreator";
    commonStr += ' --path {projectPath} --build "{buildParamStr}"';
    commonStr = commonStr.replace(/{projectPath}/g, Editor.projectPath);

    let buildParamStr = 'platform={platform};debug={isDebug};template=default';

    buildParamStr = buildParamStr.replace(/{platform}/g, targetPlatform);

    //自定义加密脚本
    if (suportEncryptJs && !isDebug) {
      let xxteaKeyStr = ';encryptJs=true;xxteaKey={xxteaKey};zipCompressJs=true';
      xxteaKeyStr = xxteaKeyStr.replace(/{xxteaKey}/g, wanba_config.xxteaKey);
      buildParamStr += xxteaKeyStr;
    }

    if (isDebug) {
      buildParamStr = buildParamStr.replace(/{isDebug}/g, "true");
    }
    else {
      buildParamStr = buildParamStr.replace(/{isDebug}/g, "false");
    }

    commonStr = commonStr.replace(/{buildParamStr}/g, buildParamStr);
    try {
      Editor.log('buildProject! begin ');
      await Promise.resolve(this.excCommondAsync(commonStr));
      Editor.log('buildProject! end');
    } catch (error) {
      Editor.log('buildProject! err');
    }
  },

  async moveToBuild() {
    //移动到build
    var path = require('path');
    let tempFrom = Editor.projectPath + "/build/jsb-default";
    tempFrom = path.normalize(tempFrom);
    let commonStr = 'rm -r -f {wanba_game_out_path}/res'
    commonStr += ' && rm -r -f {wanba_game_out_path}/src'
    commonStr += ' && cp -r -f {tempFrom}/res {wanba_game_out_path}/res';
    commonStr += ' && mkdir {wanba_game_out_path}/src/';
    if (isDebug) {
      commonStr += ' && cp -r -f {tempFrom}/src/project.dev.js {wanba_game_out_path}/src/project.js';
      commonStr += ' && cp -r -f {tempFrom}/src/settings.js {wanba_game_out_path}/src/settings.js';
    }
    else {
      commonStr += ' && cp -r -f {tempFrom}/src/project.jsc {wanba_game_out_path}/src/project.jsc';
      commonStr += ' && cp -r -f {tempFrom}/src/settings.jsc {wanba_game_out_path}/src/settings.jsc';
    }
    commonStr = commonStr.replace(/{tempFrom}/g, tempFrom);
    commonStr = commonStr.replace(/{wanba_game_out_path}/g, wanba_game_out_path);

    try {
      Editor.log('moveToBuild! begin ');
      await Promise.resolve(this.excCommondAsync(commonStr));
      Editor.log('moveToBuild! end');
    } catch (error) {
      Editor.log('moveToBuild! err');
    }
  },

  async moveToAndroidPoject() {
    var path = require('path');
    let tempPath = Editor.projectPath + "/../../../android_src/app/assets/";
    tempPath = path.normalize(tempPath);

    let commonStr = 'cp -r -f {wanba_game_out_path} {tempPath}';
    commonStr = commonStr.replace(/{tempPath}/g, tempPath);
    commonStr = commonStr.replace(/{wanba_game_out_path}/g, wanba_game_out_path);

    try {
      Editor.log('moveToAndroidPoject! begin ');
      await Promise.resolve(this.excCommondAsync(commonStr));
      Editor.log('moveToAndroidPoject! end');
    } catch (error) {
      Editor.log('moveToAndroidPoject! err');
    }
  },

  async moveToAndroidMobilePhone() {
    let targetPath = "/storage/emulated/0/Android/data/com.wodi.who/files/cocos/";
    //let targetPath = "/storage/emulated/legacy/Android/data/com.wodi.who/files/cocos";
    let commonStr = wanba_config.ndk_path + " shell rm -rf " + targetPath + wanba_game_name;
    commonStr += " && " + wanba_config.ndk_path + " push " + wanba_game_out_path + " " + targetPath;
    //删除多余的wanba_nurture_0.0.2.zip类似的文件
    commonStr += " && " + wanba_config.ndk_path + " shell rm -rf " + targetPath + wanba_game_name + "/wanba*.zip";
    Editor.log("开始替换游戏 到 android 手机", commonStr);

    try {
      Editor.log('moveToAndroidMobilePhone! begin');
      await Promise.resolve(this.excCommondAsync(commonStr));
      Editor.log('moveToAndroidMobilePhone! end');
    } catch (error) {
      Editor.log('moveToAndroidMobilePhone! err');
    }
  },

  async zipProject() {
    var fs = require('fs');
    if (!fs.existsSync(wanba_game_publish_path)) {
      let res = fs.mkdirSync(wanba_game_publish_path);
      Editor.log("create dir ", wanba_game_publish_path);
    }

    let commonStr = 'cd {wanba_game_out_path}'
    commonStr += ' && zip -P wanba_xiangbudao wanba_{gameName}_{version}.zip -r src/* res/* version.json'
    commonStr += ' && mv wanba_{gameName}_{version}.zip {wanba_game_publish_path}'
    commonStr = commonStr.replace(/{wanba_game_out_path}/g, wanba_game_out_path);
    commonStr = commonStr.replace(/{wanba_game_publish_path}/g, wanba_game_publish_path);
    commonStr = commonStr.replace(/{gameName}/g, wanba_game_name);
    commonStr = commonStr.replace(/{version}/g, this.getVersion());

    try {
      Editor.log('zipProject! begin ');
      await Promise.resolve(this.excCommondAsync(commonStr));
      Editor.log('zipProject! end');
    } catch (error) {
      Editor.log('zipProject! err');
    }
  },

  async build() {
    Editor.log('build!', wanba_game_name);

    try {
      Editor.log('build! begin ');
      isDebug = true;
      await Promise.resolve(this.buildProject());
      await Promise.resolve(this.moveToBuild());
      Editor.log('build! end');
    } catch (error) {
      Editor.log('build! err');
    }

    Editor.log("构建完成 name:", wanba_game_name, " vserion:", this.getVersion());
  },

  async buildAndroid() {
    Editor.log('buildAndroid!', wanba_game_name);
    try {
      Editor.log('buildAndroid! begin ');
      isDebug = true;
      await Promise.resolve(this.buildProject());
      await Promise.resolve(this.moveToBuild());
      await Promise.resolve(this.moveToAndroidPoject());
      Editor.log('buildAndroid! end');
    } catch (error) {
      Editor.log('buildAndroid! err');
    }

    Editor.log("构建完成 name:", wanba_game_name, " vserion:", this.getVersion());
  },

  async repleaceAndroid() {
    Editor.log('repleaceAndroid!', wanba_game_name);
    if (!wanba_config.ndk_path) {
      Editor.log("请先设置ndk路径");
    }

    try {
      Editor.log('repleaceAndroid! begin ');
      isDebug = true;
      await Promise.resolve(this.buildProject());
      await Promise.resolve(this.moveToBuild());
      await Promise.resolve(this.moveToAndroidMobilePhone());
      Editor.log('repleaceAndroid! end');
    } catch (error) {
      Editor.log('repleaceAndroid! err');
    }
    Editor.log("替换完成 name:", wanba_game_name, " vserion:", this.getVersion());
  },

  async packageProject() {
    Editor.log('packageProject', wanba_game_name);
    try {
      Editor.log('packageProject! begin ');
      isDebug = false;
      await Promise.resolve(this.buildProject());
      await Promise.resolve(this.moveToBuild());
      await Promise.resolve(this.zipProject());
      Editor.log('packageProject! end');
    } catch (error) {
      Editor.log('packageProject! err');
    }
    Editor.log("打包成功 name:", wanba_game_name, " vserion:", this.getVersion());
  },

  async openCurrentFolder() {
    Editor.log('open folder', Editor.projectPath);
    let commonStr = "open " + Editor.projectPath;
    try {
      Editor.log('openCurrentFolder! begin ');
      await Promise.resolve(this.excCommondAsync(commonStr));
      Editor.log('openCurrentFolder! end');
    } catch (error) {
      Editor.log('openCurrentFolder! err');
    }
    Editor.log("打开游戏文件夹完成 name:", wanba_game_name);
  },

  async updateSkin() {
    Editor.log('update skin', Editor.projectPath);
    let toolsPath = Editor.projectPath + "/../../tools/cat_res_pub.py";
    let petDbOriginPath = Editor.projectPath + "/../arts/cat_origin/";
    let skinOriginPath = Editor.projectPath + "/../arts/output/";
    let petDbTargetPath = Editor.projectPath + "/assets/res/cat/";
    let skinTargetPath = Editor.projectPath + "/assets/resources/skin/";
    var path = require('path');
    toolsPath = path.normalize(toolsPath);
    petDbOriginPath = path.normalize(petDbOriginPath);
    skinOriginPath = path.normalize(skinOriginPath);
    petDbTargetPath = path.normalize(petDbTargetPath);
    skinTargetPath = path.normalize(skinTargetPath);


    let commonStr = "python " + toolsPath;  //生成新的皮肤
    commonStr += " && rm -vrf " + skinTargetPath + "*.png"; //删除老皮肤
    commonStr += " && cp -v " + petDbOriginPath + "*.* " + petDbTargetPath; //复制龙骨数据
    commonStr += " && cp -v " + skinOriginPath + "*.png " + skinTargetPath;//复制皮肤数据
    try {
      Editor.log('update skin! begin ');
      await Promise.resolve(this.excCommondAsync(commonStr));
      Editor.log('update skin! end');
    } catch (error) {
      Editor.log('update skin! err');
    }
    Editor.log("皮肤更新完成 name:", wanba_game_name);
  }
};