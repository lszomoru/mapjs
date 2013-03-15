/*global _, Kinetic, MAPJS, Image, setTimeout */
Kinetic.IdeaProxy = function (idea, stage, layer) {
	'use strict';
	var nodeimage,
		imageRendered,
		container = new Kinetic.Container({opacity: 0, draggable: true}),
		cacheImage = function () {
			imageRendered = true;
			idea.attrs.scale.x = stage.attrs.scale.x;
			idea.attrs.scale.y = stage.attrs.scale.y;
			var scale = stage.attrs.scale.x, x = -scale, y = -scale,
				unscaledWidth = idea.getWidth() + 20,
				unscaledHeight = idea.getHeight() + 20,
				width = (unscaledWidth * scale),
				height = (unscaledHeight * scale);
			idea.toImage({
				x: x,
				y: y,
				width: width,
				height: height,
				callback: function (img) {
					nodeimage.setImage(img);
					nodeimage.attrs.width = unscaledWidth;
					nodeimage.attrs.height = unscaledHeight;
					layer.draw();
				}
			});
		},
		nodeImageDrawFunc;

	container.attrs.x = idea.attrs.x;
	container.attrs.y = idea.attrs.y;
	idea.attrs.x = 0;
	idea.attrs.y = 0;
	nodeimage = new Kinetic.Image({
		x: -1,
		y: -1,
		width: idea.getWidth() + 20,
		height: idea.getHeight() + 20
	});
	nodeImageDrawFunc = nodeimage.getDrawFunc().bind(nodeimage);
	nodeimage.setDrawFunc(function (canvas) {
		if (idea.isVisible()) {
			if (!imageRendered) {
				cacheImage();
			}
		} else {
			if (imageRendered) {
				nodeimage.setImage();
				imageRendered = false;
			}
		}
		nodeImageDrawFunc(canvas);
	});

	container.add(nodeimage);


	container.getNodeAttrs = function () {
		return idea.attrs;
	};
	container.isVisible = function (offset) {
		return stage && stage.isRectVisible(new MAPJS.Rectangle(container.attrs.x, container.attrs.y, container.getWidth(), container.getHeight()), offset);
	};
	idea.isVisible = function (offset) {
		return stage && stage.isRectVisible(new MAPJS.Rectangle(container.attrs.x, container.attrs.y, container.getWidth(), container.getHeight()), offset);
	};


	idea.getLayer = function () {
		return layer;
	};
	idea.getStage = function () {
		return stage;
	};
	idea.getAbsolutePosition =  function () {
		return container.getAbsolutePosition();
	};

	container.transitionToAndDontStopCurrentTransitions = function (config) {
		var transition = new Kinetic.Transition(container, config),
			animation = new Kinetic.Animation();
		animation.func = transition._onEnterFrame.bind(transition);
		animation.node = container.getLayer();
		transition.onFinished = animation.stop.bind(animation);
		transition.start();
		animation.start();
	};
	_.each(['getHeight', 'getWidth'], function (fname) {
		container[fname] = function () {
			return idea && idea[fname] && idea[fname].apply(idea, arguments);
		};
	});
	_.each([':textChanged', ':editing', ':nodeEditRequested'], function (fname) {
		idea.on(fname, function (event) {
			container.fire(fname, event);
			imageRendered = false;
			if (idea.isVisible()) {
				cacheImage();
			}
		});
	});
	_.each(['setMMStyle', 'setIsSelected', 'setText', 'setIsDroppable', 'editNode'], function (fname) {
		container[fname] = function () {
			var result = idea && idea[fname] && idea[fname].apply(idea, arguments);
			imageRendered = false;
			if (idea.isVisible()) {
				cacheImage();
			}
			return result;
		};
	});
	return container;
};
