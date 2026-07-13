<!--
    This file is part of BestCraft.
    Copyright (C) 2026  Tnze

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
import { ref, reactive, watch, onMounted, watchEffect } from 'vue';
import {
    ElInput,
    ElButton,
    ElTable,
    ElTableColumn,
    ElPagination,
    ElMessage,
    ElForm,
    ElFormItem,
    ElSelect,
    ElOption,
    ElInputNumber,
} from 'element-plus';
import type { TableColumnCtx } from 'element-plus';
import { EditPen, Star, StarFilled } from '@element-plus/icons-vue';
import {
    CollectablesShopRefine,
    Item,
    newRecipe,
    Recipe,
    RecipeInfo,
} from '@/libs/Craft';
import { useRouter } from 'vue-router';
import { useFluent } from 'fluent-vue';
import { CraftType, DataSource, DataSourceType } from '@/datasource/source';
import useSettingsStore from '@/stores/settings';
import { useMediaQuery } from '@vueuse/core';
import ConfirmDialog from './ConfirmDialog.vue';
import useRecipeFavoritesStore from '@/stores/recipe-favorites';

const searchingDelayMs = 200;
const settingStore = useSettingsStore();
const router = useRouter();
const { $t } = useFluent();

const searchText = ref('');
const pagination = reactive({
    Page: 1,
    PageTotal: 1,
});
const displayTable = ref<RecipeInfo[]>([]);
const isRecipeTableLoading = ref(false);
const compactLayout = useMediaQuery('screen and (max-width: 500px)');
const filterCraftType = ref<number>();
const filterLevel = ref<number>();
const craftTypeOptions = ref<CraftType[]>([]);
const filterRecipeLevel = ref<number>();
const stellarSteadyHandCount = ref<number>(0);

const recipeFavoritesStore = useRecipeFavoritesStore();

async function craftTypeRemoteMethod() {
    const source = await settingStore.getDataSource();
    filterCraftType.value = undefined;
    craftTypeOptions.value = await source.craftTypeList();
}

let loadRecipeTableResult: Promise<{
    results: RecipeInfo[];
    totalPages: number;
}> | null = null;

async function updateRecipePage(
    dataSource: DataSource,
    pageNumber: number,
    searching: string,
) {
    let timer = setTimeout(() => (isRecipeTableLoading.value = true), 200);
    try {
        let promise = dataSource.recipeTable(
            pageNumber,
            searching,
            filterRecipeLevel.value,
            filterCraftType.value,
            filterLevel.value ? filterLevel.value * 10 - 9 : undefined,
            filterLevel.value ? filterLevel.value * 10 : undefined,
            settingStore.recipeTablePageSize,
        );
        loadRecipeTableResult = promise;
        let { results, totalPages } = await promise;
        if (loadRecipeTableResult == promise) {
            displayTable.value = results;
            pagination.PageTotal = totalPages;
            loadRecipeTableResult = null;
        }
    } catch (e: any) {
        ElMessage.error(String(e));
    } finally {
        clearTimeout(timer);
        isRecipeTableLoading.value = false;
    }
}

let searchTimer: any = null;
watch(searchText, async searching => {
    const source = await settingStore.getDataSource();
    if (searchTimer != null) {
        clearTimeout(searchTimer);
    }
    switch (source.sourceType) {
        case DataSourceType.Realtime:
            updateRecipePage(source, pagination.Page, searching);
            break;
        case DataSourceType.RemoteRealtime:
            searchTimer = setTimeout(() => {
                pagination.Page = 1;
                updateRecipePage(source, pagination.Page, searching);
                searchTimer = null;
            }, searchingDelayMs);
            break;
    }
});

watch(
    () => pagination.Page,
    async pageNumber => {
        const source = await settingStore.getDataSource();
        await updateRecipePage(source, pageNumber, searchText.value);
    },
);

async function triggerSearch() {
    const source = await settingStore.getDataSource();
    const searching = searchText.value;
    pagination.Page = 1;
    await updateRecipePage(source, 1, searching);
}

onMounted(async () => {
    triggerSearch();
    craftTypeRemoteMethod();
});

watch(
    () => [settingStore.dataSource, settingStore.dataSourceLang],
    () => {
        triggerSearch();
        craftTypeRemoteMethod();
    },
);

watch(
    () => settingStore.recipeTablePageSize,
    () => {
        triggerSearch();
    },
);

watchEffect(() => {
    const recipeId = router.currentRoute.value.query.recipeId;
    if (recipeId !== undefined) {
        selectRecipeById(Number(recipeId));
    }
});

const confirmDialogVisible = ref(false);
const recipe = ref<Recipe>();
const recipeInfo = ref<RecipeInfo>();
const itemInfo = ref<Item>();
const collectability = ref<CollectablesShopRefine>();

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
        confirmDialogVisible.value = true;
        stellarSteadyHandCount.value =
            temporaryActionInfo?.action == 46843
                ? temporaryActionInfo.count
                : 0;
    } catch (e: any) {
        ElMessage.error(String(e));
    } finally {
        isRecipeTableLoading.value = false;
    }
}

async function selectRecipeById(recipeId: number) {
    const source = await settingStore.getDataSource();
    if (source.recipeInfo == undefined) {
        ElMessage.error($t('datasource-unsupport-recipe-info'));
        return;
    }
    try {
        isRecipeTableLoading.value = true;
        const selectedRecipeInfo = await source.recipeInfo(recipeId);
        await selectRecipeRow(selectedRecipeInfo);
    } catch (e: any) {
        ElMessage.error($t('select-recipe-by-id-error', { err: String(e) }));
        isRecipeTableLoading.value = false;
    }
}

function toggleRecipeFavorite(row: RecipeInfo) {
    recipeFavoritesStore.toggleRecipe(row.id);
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
        <el-input
            v-model="searchText"
            @keydown.enter="triggerSearch"
            class="search-input"
            :placeholder="$t('search')"
            clearable
        >
            <template #append>
                <el-button
                    :icon="EditPen"
                    @click="router.push('/recipe/customize')"
                >
                    {{ $t('custom-recipe') }}
                </el-button>
            </template>
        </el-input>
        <div class="filter-row">
            <el-form class="select-filters">
                <el-form-item :label="$t('craft-type')">
                    <el-select
                        v-model="filterCraftType"
                        clearable
                        :remote-method="craftTypeRemoteMethod"
                        @change="triggerSearch"
                    >
                        <el-option
                            v-for="{ id, name } in craftTypeOptions"
                            :key="id"
                            :value="id"
                            :label="name"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('level')">
                    <el-select
                        v-model="filterLevel"
                        @change="triggerSearch"
                        clearable
                    >
                        <el-option
                            v-for="i in 10"
                            :key="i"
                            :value="i"
                            :label="`${i * 10 - 9} ~ ${i * 10}`"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('recipe-level')">
                    <el-input-number
                        v-model="filterRecipeLevel"
                        clearable
                        :min="1"
                        :max="799"
                        :step="1"
                        step-strictly
                        :controls="false"
                        @change="triggerSearch"
                    />
                </el-form-item>
            </el-form>
        </div>
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
                        @click.stop="toggleRecipeFavorite(row as RecipeInfo)"
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
        <el-pagination
            v-if="pagination.PageTotal > 1"
            layout="prev, pager, next"
            v-model:current-page="pagination.Page"
            :page-count="pagination.PageTotal"
        />
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

.search-input {
    margin: 10px 0;
    width: 80%;
}

.filter-row {
    display: flex;
    justify-content: space-between;
    width: 80%;
    gap: 5%;
    max-width: 800px;
}

.el-table {
    user-select: none;
    --el-fill-color-blank: transparent;
}

.el-pagination {
    justify-content: center;
    --el-fill-color-blank: transparent;
}

.select-filters {
    flex: 1;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    gap: 5%;
}

.select-filters :deep(.el-form-item) {
    flex: 1;
    margin-bottom: 0;
}

.select-filters :deep(.el-select),
.select-filters :deep(.el-input-number) {
    width: 100%;
}
</style>

<fluent locale="zh-CN">
datasource-unsupport-recipe-info = 当前数据源不支持从外部选择配方
select-recipe-by-id-error = 获取配方信息失败：{ $err }，请尝试切换数据源
failed-to-load-temporary-action-info = 获取任务指令失败：{ $err }

search = 键入以搜索
please-wait = 请稍等...

type = 类型
craft-type = 制作类型
level = 等级
name = 名称
can-hq = 存在HQ

favorite = 收藏
unfavorite = 取消收藏
clear-all-favorites = 清空收藏
clear-all-favorites-confirm = 确认要重置所有收藏的配方吗？
</fluent>

<fluent locale="zh-TW">
datasource-unsupport-recipe-info = 當前資料來源不支援從外部選擇配方
select-recipe-by-id-error = 獲取配方資訊失敗：{ $err }，請嘗試切換資料來源
failed-to-load-temporary-action-info = 獲取任務指令失敗：{ $err }

search = 鍵入以搜尋
please-wait = 請稍等...

type = 職業
craft-type = 製作職業
level = 等級
name = 名稱
can-hq = 存在HQ

favorite = 收藏
unfavorite = 取消收藏
clear-all-favorites = 清空收藏
clear-all-favorites-confirm = 確認要重置所有收藏的配方嗎？
</fluent>

<fluent locale="en-US">
datasource-unsupport-recipe-info = Current data-source doesn't support choice recipe from external pages
select-recipe-by-id-error = Error fetching recipe data: { $err }. Please try choosing another DataSource
failed-to-load-temporary-action-info = Failed to load temporary action info: { $err }

search = Search
please-wait = Please wait...

type = Type
craft-type = Craft Type
level = Level
name = Name
can-hq = Can HQ

favorite = Favorite
unfavorite = Unfavorite
clear-all-favorites = Clear Favorites
clear-all-favorites-confirm = Reset all favorite recipes?
</fluent>

<fluent locale="ja-JP">
datasource-unsupport-recipe-info = 現在のデータソースは外部からのレシピ選択をサポートしていません
select-recipe-by-id-error = レシピ情報の取得に失敗しました：{ $err }。データソースの切り替えをお試しください
failed-to-load-temporary-action-info = コンテンツアクションの取得に失敗しました：{ $err }

search = 入力して検索
please-wait = お待ちください...

type = タイプ
craft-type = 製作タイプ
level = レベル
name = アイテム
can-hq = HQ可

favorite = お気に入り
unfavorite = お気に入り解除
clear-all-favorites = お気に入り消去
clear-all-favorites-confirm = 登録したレシピをすべて消去しますか？
</fluent>
