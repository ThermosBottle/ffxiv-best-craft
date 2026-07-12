// This file is part of BestCraft.
// Copyright (C) 2026 Tnze
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

import { defineStore } from 'pinia';

interface RecipeFavoritesData {
    recipes: number[];
}

export default defineStore('recipe-favorites', {
    state: () => ({
        recipes: [] as number[],
    }),
    getters: {
        toJson(): string {
            const data: RecipeFavoritesData = {
                recipes: this.recipes,
            };
            return JSON.stringify(data);
        },
        hasRecipe(): (recipeId: number) => boolean {
            return (recipeId: number) => this.recipes.includes(recipeId);
        },
    },
    actions: {
        fromJson(json: string) {
            try {
                const parsed = JSON.parse(json) as RecipeFavoritesData;
                this.recipes = parsed?.recipes || [];
            } catch (err) {
                console.error(err);
            }
        },
        addRecipe(recipeId: number) {
            if (!Number.isInteger(recipeId) || recipeId <= 0) return;
            if (!this.recipes.includes(recipeId)) {
                this.recipes.unshift(recipeId);
            }
        },
        clearRecipes() {
            this.recipes.splice(0);
        },
        removeRecipe(recipeId: number) {
            const index = this.recipes.indexOf(recipeId);
            if (index >= 0) {
                this.recipes.splice(index, 1);
            }
        },
        toggleRecipe(recipeId: number) {
            if (this.recipes.includes(recipeId)) {
                this.removeRecipe(recipeId);
            } else {
                this.addRecipe(recipeId);
            }
        },
    },
});
