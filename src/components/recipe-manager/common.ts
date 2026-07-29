// This file is part of BestCraft.
// Copyright (C) 2024 Tnze
//
// BestCraft is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// BestCraft is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import {
    CollectablesShopRefine,
    Item,
    Jobs,
    Recipe,
    RecipeRequirements,
} from '@/libs/Craft';
import useDesignerStore from '@/stores/designer';

const designerStore = useDesignerStore();

export const craftTypeIdToJobMap: Record<number, Jobs> = {
    0: Jobs.Carpenter,
    1: Jobs.Blacksmith,
    2: Jobs.Armorer,
    3: Jobs.Goldsmith,
    4: Jobs.Leatherworker,
    5: Jobs.Weaver,
    6: Jobs.Alchemist,
    7: Jobs.Culinarian,
};

// Fallback for online API responses that don't provide
// `craft_type_id` now. So we have to use `craftTypeIdToJob` /
// `recipeInfoToJob(craft_type_id, ...)` and treat names as display data only.
const legacyCraftTypeNameToJobMap: Record<string, Jobs> = {
    // zh-CN
    木工: Jobs.Carpenter,
    锻冶: Jobs.Blacksmith,
    铸甲: Jobs.Armorer,
    雕金: Jobs.Goldsmith,
    制革: Jobs.Leatherworker,
    裁缝: Jobs.Weaver,
    炼金: Jobs.Alchemist,
    烹调: Jobs.Culinarian,

    // zh-TW
    鍛造: Jobs.Blacksmith,
    金工: Jobs.Goldsmith,
    皮革: Jobs.Leatherworker,
    裁縫: Jobs.Weaver,
    鍊金: Jobs.Alchemist,
    烹調: Jobs.Culinarian,

    // ja-JP
    鍛冶: Jobs.Blacksmith,
    甲冑: Jobs.Armorer,
    彫金: Jobs.Goldsmith,
    革細工: Jobs.Leatherworker,
    錬金: Jobs.Alchemist,
    調理: Jobs.Culinarian,

    // en-US
    Woodworking: Jobs.Carpenter,
    Smithing: Jobs.Blacksmith,
    Armorcraft: Jobs.Armorer,
    Goldsmithing: Jobs.Goldsmith,
    Leatherworking: Jobs.Leatherworker,
    Clothcraft: Jobs.Weaver,
    Alchemy: Jobs.Alchemist,
    Cooking: Jobs.Culinarian,

    // de-DE
    Zimmerer: Jobs.Carpenter,
    Grobschmied: Jobs.Blacksmith,
    Plattner: Jobs.Armorer,
    Goldschmied: Jobs.Goldsmith,
    Gerber: Jobs.Leatherworker,
    Weber: Jobs.Weaver,
    Alchemist: Jobs.Alchemist,
    Gourmet: Jobs.Culinarian,

    // fr-FR
    Menuiserie: Jobs.Carpenter,
    Métallurgie: Jobs.Blacksmith,
    Armurerie: Jobs.Armorer,
    Orfèvrerie: Jobs.Goldsmith,
    Tannerie: Jobs.Leatherworker,
    Couture: Jobs.Weaver,
    Alchimie: Jobs.Alchemist,
    Cuisine: Jobs.Culinarian,
};

export function craftTypeIdToJob(
    craftTypeId: number | undefined,
): Jobs | undefined {
    return craftTypeId == undefined
        ? undefined
        : craftTypeIdToJobMap[craftTypeId];
}
export function recipeInfoToJob(
    craftTypeId: number | undefined,
    craftTypeName: string | undefined,
): Jobs | undefined {
    return (
        craftTypeIdToJob(craftTypeId) ??
        legacyCraftTypeNameToJobMap[craftTypeName ?? '']
    );
}

export const selectRecipe = (
    recipe: Recipe,
    recipeId: number | undefined,
    materialQualityFactor: number,
    requirements: RecipeRequirements,
    collectability: CollectablesShopRefine | undefined,
    item: Item,
    craftType: string | undefined,
    craftTypeId: number | undefined,
    simulatorMode: boolean,
    stellarSteadyHandCount: number,
) => {
    designerStore.selectRecipe({
        job: recipeInfoToJob(craftTypeId, craftType),
        item,
        recipe,
        recipeId,
        materialQualityFactor,
        requirements,
        collectability,
        simulatorMode,
        stellarSteadyHandCount,
    });
};
