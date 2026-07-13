<!--
    This file is part of BestCraft.
    Copyright (C) 2026 ThermosBottle

    BestCraft is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    BestCraft is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
    ElButton,
    ElMessage,
    ElMessageBox,
    ElTable,
    ElTableColumn,
} from 'element-plus';
import type { TableColumnCtx } from 'element-plus';
import { useMediaQuery } from '@vueuse/core';
import { useFluent } from 'fluent-vue';
import { Star, StarFilled } from '@element-plus/icons-vue';
import {
    CollectablesShopRefine,
    Item,
    newRecipe,
    Recipe,
    RecipeInfo,
} from '@/libs/Craft';
import useSettingsStore from '@/stores/settings';
import useRecipeFavoritesStore from '@/stores/recipe-favorites';
import ConfirmDialog from './ConfirmDialog.vue';

const props = defineProps<{
    active: boolean;
}>();

const { $t } = useFluent();
const settingStore = useSettingsStore();
const recipeFavoritesStore = useRecipeFavoritesStore();
const compactLayout = useMediaQuery('screen and (max-width: 500px)');

const displayTable = ref<RecipeInfo[]>([]);
const isRecipeTableLoading = ref(false);
const confirmDialogVisible = ref(false);
const recipe = ref<Recipe>();
const recipeInfo = ref<RecipeInfo>();
const itemInfo = ref<Item>();
const collectability = ref<CollectablesShopRefine>();
const stellarSteadyHandCount = ref<number>(0);

let loadFavoritesRequest = 0;

async function refreshFavorites() {
    if (!props.active) return;
    const requestId = ++loadFavoritesRequest;
    isRecipeTableLoading.value = true;
    try {
        const source = await settingStore.getDataSource();
        const favoriteIds = recipeFavoritesStore.recipes.slice();
        if (favoriteIds.length === 0) {
            if (requestId === loadFavoritesRequest) {
                displayTable.value = [];
            }
            return;
        }

        let results: RecipeInfo[];
        if (source.recipeInfoList) {
            results = await source.recipeInfoList(favoriteIds);
        } else if (source.recipeInfo) {
            results = await Promise.all(
                favoriteIds.map(recipeId => source.recipeInfo!(recipeId)),
            );
        } else {
            ElMessage.error($t('datasource-unsupport-recipe-info'));
            return;
        }

        const recipeMap = new Map(results.map(info => [info.id, info]));
        if (requestId === loadFavoritesRequest) {
            displayTable.value = favoriteIds
                .map(recipeId => recipeMap.get(recipeId))
                .filter((info): info is RecipeInfo => info != undefined);
        }
    } catch (e: any) {
        ElMessage.error(String(e));
    } finally {
        if (requestId === loadFavoritesRequest) {
            isRecipeTableLoading.value = false;
        }
    }
}

watch(
    () => props.active,
    active => {
        if (active) {
            refreshFavorites();
        }
    },
    { immediate: true },
);

watch(
    () => recipeFavoritesStore.recipes.slice(),
    () => {
        refreshFavorites();
    },
);

watch(
    () => [settingStore.dataSource, settingStore.dataSourceLang],
    () => {
        refreshFavorites();
    },
);

async function selectRecipeRow(row: RecipeInfo) {
    try {
        isRecipeTableLoading.value = true;
        const source = await settingStore.getDataSource();

        const [
            recipeLevel,
            itemInfoTmp,
            collectabilityTmp,
            temporaryActionInfo,
        ] = await Promise.all([
            source.recipeLevelTable(row.rlv),
            source.itemInfo(row.item_id),
            (async () => {
                if (source.recipeCollectableShopRefine == undefined) {
                    return undefined;
                }
                try {
                    return await source.recipeCollectableShopRefine(row.id);
                } catch (e: any) {
                    console.error('Failed to fatch recipe collectability', e);
                    return undefined;
                }
            })(),
            (async () => {
                if (source.temporaryActionInfo) {
                    try {
                        return await source.temporaryActionInfo(row.id);
                    } catch (err: any) {
                        ElMessage({
                            type: 'warning',
                            message: $t(
                                'failed-to-load-temporary-action-info',
                                { err: String(err) },
                            ),
                        });
                    }
                }
                return undefined;
            })(),
        ]);

        recipe.value = await newRecipe(
            recipeLevel,
            row.difficulty_factor,
            row.quality_factor,
            row.durability_factor,
        );
        recipeInfo.value = row;
        itemInfo.value = itemInfoTmp;
        collectability.value = collectabilityTmp;
        stellarSteadyHandCount.value =
            temporaryActionInfo?.action == 46843
                ? temporaryActionInfo.count
                : 0;
        confirmDialogVisible.value = true;
    } catch (e: any) {
        ElMessage.error(String(e));
    } finally {
        isRecipeTableLoading.value = false;
    }
}

async function clickRecipeRow(
    row: RecipeInfo,
    _column: TableColumnCtx<RecipeInfo> | null,
    event: PointerEvent,
) {
    const target = event.target as HTMLElement;
    if (target.closest('.favorite-column')) {
        return;
    }
    await selectRecipeRow(row);
}

function toggleRecipeFavorite(row: RecipeInfo) {
    recipeFavoritesStore.toggleRecipe(row.id);
}

async function clearAllFavorites() {
    if (recipeFavoritesStore.recipes.length === 0) return;
    try {
        await ElMessageBox.confirm(
            $t('clear-all-favorites-confirm'),
            $t('clear-all-favorites'),
            { type: 'warning' },
        );
    } catch {
        return;
    }
    recipeFavoritesStore.clearRecipes();
}
</script>

<template>
    <div class="container">
        <ConfirmDialog
            v-if="recipe && recipeInfo && itemInfo"
            v-model="confirmDialogVisible"
            v-model:recipe="recipe"
            :recipe-info="recipeInfo"
            :item-info="itemInfo"
            :collectability="collectability"
            :stellarSteadyHandCount="stellarSteadyHandCount"
        />
        <div class="content">
            <el-button
                type="primary"
                class="clear-button"
                @click="clearAllFavorites"
            >
                {{ $t('clear-all-favorites') }}
            </el-button>
            <el-table
                v-tnze-loading="isRecipeTableLoading"
                :element-loading-text="$t('please-wait')"
                highlight-current-row
                @row-click="clickRecipeRow"
                :data="displayTable"
                height="100%"
                style="width: 100%"
            >
                <el-table-column
                    width="56"
                    align="center"
                    class-name="favorite-column"
                >
                    <template #default="{ row }">
                        <el-button
                            rectangle
                            text
                            size="small"
                            style="width: 100%; height: 100%"
                            :type="
                                recipeFavoritesStore.hasRecipe(row.id)
                                    ? 'warning'
                                    : 'info'
                            "
                            :icon="
                                recipeFavoritesStore.hasRecipe(row.id)
                                    ? StarFilled
                                    : Star
                            "
                            :title="
                                recipeFavoritesStore.hasRecipe(row.id)
                                    ? $t('unfavorite')
                                    : $t('favorite')
                            "
                            @click.stop="
                                toggleRecipeFavorite(row as RecipeInfo)
                            "
                        />
                    </template>
                </el-table-column>
                <el-table-column
                    prop="id"
                    label="ID"
                    :width="compactLayout ? undefined : 100"
                />
                <el-table-column
                    prop="rlv"
                    :label="$t('recipe-level')"
                    :width="compactLayout ? undefined : 100"
                />
                <el-table-column
                    prop="job"
                    :label="$t('type')"
                    :width="compactLayout ? undefined : 200"
                />
                <el-table-column prop="item_name" :label="$t('name')" />
            </el-table>
        </div>
    </div>
</template>

<style scoped>
.container {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: transparent !important;
}

.content {
    width: 100%;
    margin: 10px 10px;
}

.clear-button {
    flex: 0 0 auto;
}

.el-table {
    user-select: none;
    --el-fill-color-blank: transparent;
}
</style>

<fluent locale="zh-CN">
datasource-unsupport-recipe-info = 当前数据源不支持从外部选择配方
failed-to-load-temporary-action-info = 获取任务指令失败：{ $err }
please-wait = 请稍等...
type = 类型
name = 名称

favorite = 收藏
unfavorite = 取消收藏
clear-all-favorites = 清空收藏
clear-all-favorites-confirm = 确认要重置所有收藏的配方吗？
</fluent>

<fluent locale="zh-TW">
datasource-unsupport-recipe-info = 當前資料來源不支援從外部選擇配方
failed-to-load-temporary-action-info = 獲取任務指令失敗：{ $err }
please-wait = 請稍等...
type = 職業
name = 名稱

favorite = 收藏
unfavorite = 取消收藏
clear-all-favorites = 清空收藏
clear-all-favorites-confirm = 確認要重置所有收藏的配方嗎？
</fluent>

<fluent locale="en-US">
datasource-unsupport-recipe-info = Current data-source doesn't support choice recipe from external pages
failed-to-load-temporary-action-info = Failed to load temporary action info: { $err }
please-wait = Please wait...
type = Type
name = Item

favorite = Favorite
unfavorite = Unfavorite
clear-all-favorites = Clear Favorites
clear-all-favorites-confirm = Reset all favorite recipes?
</fluent>

<fluent locale="ja-JP">
datasource-unsupport-recipe-info = 現在のデータソースは外部からのレシピ選択をサポートしていません
failed-to-load-temporary-action-info = コンテンツアクションの取得に失敗しました：{ $err }
please-wait = お待ちください...
type = タイプ
name = アイテム

favorite = お気に入り
unfavorite = お気に入り解除
clear-all-favorites = お気に入り消去
clear-all-favorites-confirm = 登録したレシピをすべて消去しますか？
</fluent>
