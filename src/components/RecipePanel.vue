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
import { ref, onActivated } from 'vue';
import { ElTabs, ElTabPane } from 'element-plus';
import { useFluent } from 'fluent-vue';
import RecipeSelector from './recipe-manager/RecipeSelector.vue';
import RecipeFavored from './recipe-manager/RecipeFavored.vue';

const emit = defineEmits<{
    (e: 'setTitle', title: string): void;
}>();
onActivated(() => emit('setTitle', 'select-recipe'));

const { $t } = useFluent();
const activeTab = ref('recipes');
</script>

<template>
    <div class="container">
        <el-tabs v-model="activeTab" class="tabs-container">
            <el-tab-pane :label="$t('recipe')" name="recipes">
                <RecipeSelector />
            </el-tab-pane>
            <el-tab-pane :label="$t('favorite')" name="favorites">
                <RecipeFavored :active="activeTab === 'favorites'" />
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<style scoped>
.container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: transparent !important;
}

.tabs-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.tabs-container :deep(.el-tabs__content) {
    flex: 1;
    width: 100%;
    display: flex;
}

.tabs-container :deep(.el-tab-pane) {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}
</style>

<fluent locale="zh-CN">
recipe = 配方
favorite = 收藏
</fluent>

<fluent locale="zh-TW">
recipe = 配方
favorite = 收藏
</fluent>

<fluent locale="en-US">
recipe = Recipes
favorite = Favorite
</fluent>

<fluent locale="ja-JP">
recipe = レシピ
favorite = お気に入り
</fluent>
