(function(window, angular, undefined){
    'use strict';
	
    var bd = angular.module("ngTreeFrame", []);
    /*定义全局变量*/
    bd.constant('ngTreeFrameCfg', {
        // treeHtml: 'ngTreeFrame.html'
    });
    /*定义模板缓存默认的模板和多选模板*/
    bd.run(['$templateCache', function($templateCache){
        $templateCache.put('defaultTemplate',[
            '<div class="tree-frame" ng-if="treeData.id" ng-click="treeMenuStatus($event)">',
                '<ul class="tree-frame-ul">',
                    '<li class="">',
                        '<div class="tree-node-title">',
                            '<div ng-class="{', "'node-menu': true, 'selected': selectNodeData.id == treeData.id}", '" id="node{{treeData.id}}" ng-click="selectNode(', "'treeNodeClick'", ', treeData, $event)">',
                                '<img ng-if="!_treeConfigObj.parentIcon && item.treeFrameIcon" class="node-icon" ng-src="{{item.treeFrameIcon}}" alt="icon">',
                                '<img ng-if="_treeConfigObj.parentIcon" class="node-icon" ng-src="{{_treeConfigObj.parentIcon}}" alt="icon">',
                                '{{treeData.name}}',
                            '</div>',
                            '<div ng-class="{',
                                "'tree-menu': true,",
                                "'fadeInLeft': selectNodeData.id == treeData.id && !treeData.disableTreeMenu && !hideMenu",
                               '}"',
                                'ng-if="selectNodeData.id == treeData.id && !treeData.disableTreeMenu" ng-hide="hideMenu">',
                                '<div class="menu-item" ng-repeat="menuItem in _treeConfigObj.menuConfig" ng-click="selectMenu(treeData, menuItem)">{{menuItem.text}}</div>',
                            '</div>',
                        '</div>',
                        '<ul class="ng-tree-frame">',
                            '<li ng-repeat="item in treeData.child" ng-include="', "'",'./../html/ngTreeFrame.html', "'",'"></li>',
                        '</ul>',
                    '</li>',
                '</ul>',
            '</div>'
        ].join(''));
    }]);
    bd.controller("ngTreeFrameController", 
        ["$scope", "$element", "$attrs", '$interval', function($scope, $element, $attrs ,$interval){
			
            // 选中节点的callback,获取选中节点数据
            $scope.selectNode = function(callback, item, $event){
                $scope.selectNodeData = item;
				($scope[callback] || angular.noop)(item, $event);
			};
        }]);
    /*自定义指令，包装生成数据规格*/
    bd.directive("treeFrame", ['ngTreeFrameCfg', '$timeout', function(ngTreeFrameCfg, $timeout){
        return{
            scope:{
                treeData: '=',
                treeNodeClick: '=',
                // 根据字段某属性区分颜色
                bgColorConfig: '=',
                // 根据层级区分颜色
                bgColorForLevel: '=',
                // 关键字段配置
                treeFrameConfig: '='
            },
            // require: ['ngTreeFrame','?ngModel'],
            controller: "ngTreeFrameController", 
            // templateUrl: '/js/ngTreeFrame.html',
            templateUrl: function(elem, attr){
                /*如果ngTreeFrameMulti定义过则用多选模板，反之用默认*/
                return "defaultTemplate";
            }, 
            link: function(scope, el, attr, ctrls){
                scope._bgColorConfig = scope.bgColorConfig;
                scope._bgColorForLevel = scope.bgColorForLevel;
                scope._treeConfigObj = scope.treeFrameConfig || {};

                // 获取dom节点
                function getNodeById(item) {
                    var elem = angular.element(document.getElementById('node' + scope._treeConfigObj.id));
                    return elem;
                }

                // 根据属性字段判断颜色
                function chargeColorByKey(item, elem) {
                    // 区分颜色字段
                    var colorKey = scope._bgColorConfig.key;
                    // 颜色配置集合
                    var colorArray = scope._bgColorConfig.values;
                    for (var j = 0; j < colorArray.length; j++) {
                        if (item[colorKey] == colorArray[j].value) {
                            // 配置节点背景色
                            elem.css('background', colorArray[j].bgColor);
                            elem.css('color', colorArray[j].color || '#000000');
                            elem.css('border', '1px solid ' + (colorArray[j].borderColor || '#dddddd'));
                        }
                    }
                }

                // 根据层级区分颜色
                function chargeColorByLevel(item, elem) {
                    // 顶级父
                    if (!item[scope._treeConfigObj.parentId]) {
                        elem.css('background', scope.bgColorForLevel[0].bgColor);
                        elem.css('color', scope.bgColorForLevel[0].color || '#000000');
                        elem.css('border', '1px solid ' + (scope.bgColorForLevel[0].borderColor || '#dddddd'));
                    } else {
                        elem.css('background', scope.bgColorForLevel[1].bgColor);
                        elem.css('color', scope.bgColorForLevel[1].color || '#000000');
                        elem.css('border', '1px solid ' + (scope.bgColorForLevel[1].borderColor || '#dddddd'));
                    }
                }

                // 数据格式化，添加背景色和文字色
                function fmtTreeData(nodeData) {
                    if (nodeData && nodeData.child && nodeData.child.length) {
                        var parentNode = getNodeById(nodeData);
                        if (scope._bgColorConfig) {
                            chargeColorByKey(nodeData, parentNode);
                        }
                        if (scope._bgColorForLevel) {
                            chargeColorByLevel(nodeData, parentNode);
                        }
                        if (scope._treeConfigObj.icon) {
                            nodeData.treeFrameIcon = nodeData[scope._treeConfigObj.icon];
                        }
                        for (var i = 0; i < nodeData.child.length; i++) {
                            if (nodeData.child[i]) {
                                var $ele = getNodeById(nodeData.child[i]);
                                if (scope._bgColorConfig) {
                                    chargeColorByKey(nodeData.child[i], $ele);
                                }
                                if (scope._bgColorForLevel) {
                                    chargeColorByLevel(nodeData.child[i], $ele);
                                }
                                // icon赋值
                                if (scope._treeConfigObj.icon) {
                                    nodeData.child[i].treeFrameIcon = nodeData.child[i][scope._treeConfigObj.icon];
                                }
                                // console.log(nodeData.child[i])
                                fmtTreeData(nodeData.child[i]);
                            }
                        }
                    }
                }

                // 点击出现菜单
                angular.element(document).bind('click', function(event) {
                    // 操作dom需要apply
                    $timeout(function () {
                        var classNameArray = angular.element(event.target)[0].className;
                        var showCondition = classNameArray.indexOf('node-menu') > -1 || classNameArray.indexOf('node-icon') > -1;
                        scope.hideMenu = !showCondition;
                        event.stopPropagation();
                    });
                });

                // 选中菜单触发某个事件
                scope.selectMenu = function(node, menuItem) {
                    menuItem.callback(node);
                }

                scope.init = function () {
                    // $timeout用于ng-include ngTreeFrame.html
                    scope.$watch('treeData', function (newValue, oldValue) {
                        if (newValue) {
                            $timeout(function () {
                                if (scope._treeConfigObj.formatTreeData) {
                                    scope._treeConfigObj.formatTreeData(newValue);
                                }
                                fmtTreeData(newValue);
                            }, 100);
                        }
                    })
                };
                scope.init();

            },
            restrict: "AE"
        };
    }]);
})(window, window.angular);
/*加载css/js方法*/
var dynamicLoading = {
    css: function(path){
        if(!path || path.length === 0){
            throw new Error('argument "path" is required !');
        }
        var head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.href = path;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        head.appendChild(link);
    },
    js: function(path){
        if(!path || path.length === 0){
            throw new Error('argument "path" is required !');
        }
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.src = path;
        script.type = 'text/javascript';
        head.appendChild(script);
    }
};
dynamicLoading.css("./../style/style.css");