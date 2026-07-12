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

export const isWebsite = import.meta.env.VITE_BESTCRAFT_TARGET == 'web';
export const isTauri = import.meta.env.VITE_BESTCRAFT_TARGET == 'tauri';
export const isYYYYGames = window.location.hostname == 'tnze.yyyy.games';

export const DEFAULT_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 200;
