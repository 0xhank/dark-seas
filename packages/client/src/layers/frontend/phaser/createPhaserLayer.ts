import { createPhaserEngine } from "@latticexyz/phaserx";
import { defineComponent, namespaceWorld, Type } from "@latticexyz/recs";
import { BackendLayer } from "../../backend";
import { createCamera } from "./camera";
import { phaserConfig } from "./config";
import { POS_HEIGHT, POS_WIDTH } from "./constants";
import { createPhaserSystems } from "./systems";

/**
 * The Phaser layer is responsible for rendering game objects to the screen.
 */
export async function createPhaserLayer(backend: BackendLayer) {
  // --- WORLD ----------------------------------------------------------------------
  const world = namespaceWorld(backend.world, "phaser");

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    MapBounds: defineComponent(world, {
      top: Type.Number,
      right: Type.Number,
      bottom: Type.Number,
      left: Type.Number,
    }),
  };

  // --- PHASER ENGINE SETUP --------------------------------------------------------
  const { game, scenes, dispose: disposePhaser } = await createPhaserEngine(phaserConfig);
  world.registerDisposer(disposePhaser);

  const polygonRegistry = new Map<string | number, Phaser.GameObjects.Group>();
  const spriteRegistry = new Map<string | number, Phaser.GameObjects.Sprite>();

  // --- API ------------------------------------------------------------------------
  function createMapInteractionApi() {
    let enabled = true;

    return {
      disableMapInteraction: () => (enabled = false),
      enableMapInteraction: () => (enabled = true),
      mapInteractionEnabled: () => {
        return enabled;
      },
    };
  }
  // --- UTILS ----------------------------------------------------------------------

  function getSpriteObject(id: string | number, s?: Phaser.Scene): Phaser.GameObjects.Sprite {
    const scene = s || scenes.Main.phaserScene;
    const sprite = spriteRegistry.get(id);
    if (sprite) return sprite;

    const newSprite = scene.add.sprite(5, 5, "");
    spriteRegistry.set(id, newSprite);
    return newSprite;
  }

  function destroySpriteObject(id: string | number) {
    const sprite = spriteRegistry.get(id);
    if (!sprite) return;
    sprite.disableInteractive();

    sprite.off("pointerdown");
    sprite.off("pointerover");
    sprite.off("pointerout");
    sprite.destroy(true);
    spriteRegistry.delete(id);
  }

  function getGroupObject(id: string | number, clear = false, s?: Phaser.Scene): Phaser.GameObjects.Group {
    const scene = s || scenes.Main.phaserScene;
    if (clear) destroyGroupObject(id);
    const group = polygonRegistry.get(id);
    if (group) return group;

    const newGroup = scene.add.group();
    polygonRegistry.set(id, newGroup);
    return newGroup;
  }

  function destroyGroupObject(id: string | number) {
    const group = polygonRegistry.get(id);
    if (!group) return;
    group.getChildren().forEach((child) => {
      child.disableInteractive();

      child.off("pointerdown");
      child.off("pointerover");
      child.off("pointerout");
    });
    group.destroy(true, true);
    polygonRegistry.delete(id);
  }

  // --- LAYER CONTEXT --------------------------------------------------------------
  const context = {
    ...backend,
    components: { ...components, ...backend.components },
    api: {
      ...backend.api,
      mapInteraction: createMapInteractionApi(),
    },
    utils: { ...backend.utils, getSpriteObject, getGroupObject, destroySpriteObject, destroyGroupObject },
    game,
    scene: { ...scenes.Main, posWidth: POS_WIDTH, posHeight: POS_HEIGHT },
    scenes,
  };

  // --- SYSTEMS --------------------------------------------------------------------
  createPhaserSystems(context);
  createCamera(context, phaserConfig);

  return context;
}
