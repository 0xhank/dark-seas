import { setupMUDNetwork } from "@latticexyz/std-client";
import { SystemTypes } from "contracts/types/SystemTypes";
import { config } from "./config";
import { components, clientComponents } from "./components";
import { world } from "./world";
import { SystemAbis } from "contracts/types/SystemAbis.mjs";
import { EntityID, EntityIndex, getComponentValue, Has, HasValue, runQuery } from "@latticexyz/recs";
import { createFaucetService, GodID as singletonEntityId } from "@latticexyz/network";
import type { ItemTypes } from "skystrife/packages/client/src/layers/Network/types";
import { utils } from "ethers";
import { flatten } from "lodash";

export type SetupResult = Awaited<ReturnType<typeof setup>>;

export const setup = async () => {
  const result = await setupMUDNetwork<typeof components, SystemTypes>(config, world, components, SystemAbis);
  const { systems, network } = result;

  result.startSync();

  // For LoadingState updates
  const singletonEntity = world.registerEntity({ id: singletonEntityId });

  // Register player entity
  const playerAddress = result.network.connectedAddress.get();
  if (!playerAddress) throw new Error("Not connected");

  const playerEntityId = playerAddress as EntityID;
  const playerEntity = world.registerEntity({ id: playerEntityId });

  const isPlayerRegistered = () => {
    const playerAddress = (network.connectedAddress.get() || "") as EntityID;
    const playerEntity = world.entityToIndex.get(playerAddress);
    return playerEntity != undefined ? getComponentValue(components.Player, playerEntity) : false;
  };

  const getPlayerName = () => {
    const playerAddress = (network.connectedAddress.get() || "") as EntityID;
    const playerEntity = world.entityToIndex.get(playerAddress);
    const playerName = playerEntity ? getComponentValue(components.Name, playerEntity)?.value : "";

    return playerName;
  };

  const getAllPlayers = () => {
    return [...runQuery([Has(components.Player)])];
  };

  const getAllRecipes = () => {
    return [...runQuery([Has(components.Recipe)])];
  };

  const getMyItems = () => {
    return [
      ...runQuery([
        Has(components.ItemType),
        HasValue(components.OwnedBy, {
          value: network.connectedAddress.get() as EntityID,
        }),
      ]),
    ];
  };

  const adminGiveItem = (playerAddress: string, itemType: ItemTypes) => {
    return systems["amalgema.system.GiveItemDev"].executeTyped(playerAddress, itemType);
  };

  const craft = (recipeIndex: EntityIndex) => {
    const recipe = getComponentValue(components.Recipe, recipeIndex);
    if (!recipe) throw new Error("Recipe not found");
    const recipeId = world.entities[recipeIndex];

    const requiredItemTypes = recipe.itemTypes;
    const myItems = getMyItems();

    const inputItems = flatten(
      requiredItemTypes.map((itemType, i) => {
        let quantity = recipe.itemTypeQuantities[i];
        const inputItems: EntityID[] = [];

        while (quantity > 0) {
          const item = myItems.find((item) => {
            const itemComponent = getComponentValue(components.ItemType, item);
            return itemComponent?.value === itemType;
          });
          if (item) {
            myItems.splice(myItems.indexOf(item), 1);
            inputItems.push(world.entities[item]);
            quantity--;
          } else {
            break;
          }
        }

        if (quantity > 0) throw new Error("Not enough items");

        return inputItems;
      })
    );

    return systems["amalgema.system.Craft"].executeTyped(recipeId, inputItems);
  };

  const registerPlayer = (name: string) => {
    return systems["amalgema.system.RegisterPlayer"].executeTyped(name);
  };

  const joinMatch = (burnerWalletAddress: string, matchAddress: string, items: EntityIndex[]) => {
    const itemIds = items.map((i) => world.entities[i]);
    return systems["amalgema.system.JoinMatch"].executeTyped(burnerWalletAddress, matchAddress, itemIds, {
      gasLimit: 10_000_000,
    });
  };

  if (!config.devMode && config.faucetServiceUrl) {
    const faucet = createFaucetService(config.faucetServiceUrl);
    const address = network.connectedAddress.get();
    console.info("[Dev Faucet]: Player Address -> ", address);

    const requestDrip = async () => {
      const balance = await network.signer.get()?.getBalance();
      console.info(`[Dev Faucet]: Player Balance -> ${balance}`);
      const playerIsBroke = balance?.lte(utils.parseEther("1"));
      console.info(`[Dev Faucet]: Player is broke -> ${playerIsBroke}`);
      if (playerIsBroke) {
        console.info("[Dev Faucet]: Dripping funds to player");
        // Double drip
        address && (await faucet?.dripDev({ address })) && (await faucet?.dripDev({ address }));
      }
    };

    requestDrip();
    // Request a drip every 20 seconds
    setInterval(requestDrip, 20000);
  }

  const mud = {
    ...result,
    world,
    singletonEntityId,
    singletonEntity,
    playerAddress,
    playerEntityId,
    playerEntity,
    components: {
      ...result.components,
      ...clientComponents,
    },
    api: {
      isPlayerRegistered,
      getPlayerName,
      getAllPlayers,
      getAllRecipes,
      getMyItems,
      adminGiveItem,
      craft,
      registerPlayer,
      joinMatch,
    },
  };

  return mud;
};
