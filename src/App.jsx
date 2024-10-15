import { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    getDocs,
    setDoc,
    query,
    where,
} from 'firebase/firestore/lite';

import * as Tabs from '@radix-ui/react-tabs';
import * as Select from '@radix-ui/react-select';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { X, Folder, Plus, Link, Save, Settings, Moon, Sun } from 'lucide-react';

import placeHolderIcon from './assets/placeholder.png';

export default function TabManagerExtension() {
    // const [tabs, setTabs] = useState([
    //     {
    //         id: 1,
    //         title: 'Google Search',
    //         favicon: 'https://www.google.com/favicon.ico',
    //         url: 'https://www.google.com/',
    //     },
    //     {
    //         id: 2,
    //         title: 'YouTube',
    //         favicon: 'https://www.youtube.com/favicon.ico',
    //         url: 'https://www.youtube.com/',
    //     },
    //     {
    //         id: 3,
    //         title: 'Facebook',
    //         favicon: 'https://www.facebook.com/favicon.ico',
    //         url: 'https://www.facebook.com/',
    //     },
    //     {
    //         id: 4,
    //         title: 'Gmail',
    //         favicon: 'https://www.google.com/favicon.ico',
    //         url: 'https://mail.google.com/',
    //     },
    //     {
    //         id: 5,
    //         title: 'Stack Overflow',
    //         favicon: 'https://stackoverflow.com/favicon.ico',
    //         url: 'https://stackoverflow.com/',
    //     },
    //     {
    //         id: 6,
    //         title: 'Wikipedia',
    //         favicon: 'https://en.wikipedia.org/favicon.ico',
    //         url: 'https://en.wikipedia.org/',
    //     },
    //     {
    //         id: 7,
    //         title: 'GitHub',
    //         favicon: 'https://github.com/favicon.ico',
    //         url: 'https://github.com/',
    //     },
    //     {
    //         id: 8,
    //         title: 'Reddit',
    //         favicon: 'https://www.reddit.com/favicon.ico',
    //         url: 'https://www.reddit.com/',
    //     },
    //     {
    //         id: 9,
    //         title: 'Twitter',
    //         favicon: 'https://twitter.com/favicon.ico',
    //         url: 'https://twitter.com/',
    //     },
    //     {
    //         id: 10,
    //         title: 'Amazon',
    //         favicon: 'https://www.amazon.com/favicon.ico',
    //         url: 'https://www.amazon.com/',
    //     },
    // ]);
    const [tabs, setTabs] = useState([]);
    const [savedTabs, setSavedTabs] = useState([]);
    const [url, setUrl] = useState('');
    const [category, setCategory] = useState('Uncategorized');
    const [editingTab, setEditingTab] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isDarkMode, setDarkMode] = useState(false);

    useEffect(() => {
        chrome.tabs.query({}, (response) => {
            if (response) {
                const formattedTabs = response.map((tab) => ({
                    id: tab.id,
                    title: tab.title,
                    url: tab.url,
                    favicon: tab.favIconUrl || placeHolderIcon,
                    category: 'Uncategorized',
                }));
                setTabs(formattedTabs);
            }
        });
    }, []);

    useEffect(() => {
        const fetchSavedTabs = async () => {
            const querySnapshot = await getDocs(collection(db, 'savedTabs'));
            const loadedTabs = {};

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (!loadedTabs[data.category]) {
                    loadedTabs[data.category] = [];
                }
                loadedTabs[data.category].push({ ...data, id: doc.id });
            });

            setSavedTabs(loadedTabs);
        };

        fetchSavedTabs();
    }, []);

    const handleCloseTab = (id) => {
        setTabs(tabs.filter((tab) => tab.id !== id));
    };

    const handleCaptureUrl = async () => {
        if (!url) return;

        // Check if the URL is already saved
        const urlExists = Object.values(savedTabs).some((tabs) =>
            tabs.some((tab) => tab.url === url)
        );

        if (!urlExists) {
            // Create a new tab object
            const newTab = {
                title: url,
                url,
                favicon: placeHolderIcon,
                category,
            };

            try {
                // Save the new tab to Firebase
                const docRef = await addDoc(
                    collection(db, 'savedTabs'),
                    newTab
                );
                console.log('Tab saved with ID: ', docRef.id);

                // Update the local state to reflect the new saved tab
                setSavedTabs((prev) => {
                    const updatedGroups = { ...prev };
                    if (!updatedGroups[category]) {
                        updatedGroups[category] = [];
                    }
                    updatedGroups[category].push(newTab);
                    return updatedGroups;
                });

                // Clear the input after saving
                setUrl('');
            } catch (error) {
                console.error('Error saving tab: ', error);
            }
        } else {
            console.log('This URL is already saved.');
        }
    };

    const handleEditTab = (tab) => {
        setEditingTab(tab);
    };

    const handleSaveEdit = () => {
        setTabs(
            tabs.map((tab) => (tab.id === editingTab.id ? editingTab : tab))
        );
        setEditingTab(null);
    };

    const handleCaptureCurrentTab = () => {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            (tabsArray) => {
                if (tabsArray.length > 0) {
                    const activeTab = tabsArray[0];
                    const newTab = {
                        title: activeTab.title || 'Untitled Tab',
                        favicon: activeTab.favIconUrl || placeHolderIcon,
                        url: activeTab.url,
                        category: 'Uncategorized',
                    };

                    const urlExists = Object.values(savedTabs).some((tabs) =>
                        tabs.some((tab) => tab.url === newTab.url)
                    );

                    if (!urlExists) {
                        // Save the captured tab to Firebase
                        const savedTabDocRef = doc(collection(db, 'savedTabs'));
                        setDoc(savedTabDocRef, newTab)
                            .then(() => {
                                console.log('Tab successfully saved');
                                setSavedTabs((prev) => {
                                    const updatedGroups = { ...prev };
                                    if (!updatedGroups['Uncategorized']) {
                                        updatedGroups['Uncategorized'] = [];
                                    }
                                    updatedGroups['Uncategorized'].push(newTab);
                                    return updatedGroups;
                                });
                            })
                            .catch((error) => {
                                console.error('Error saving tab: ', error);
                            });
                    } else {
                        console.log(
                            'This tab is already saved in the Uncategorized category.'
                        );
                    }
                }
            }
        );
    };

    const handleSaveToCategory = async () => {
        if (editingTab && editingTab.category) {
            const urlExists = Object.values(savedTabs).some((tabs) =>
                tabs.some((tab) => tab.url === editingTab.url)
            );

            if (!urlExists) {
                const newTab = {
                    title: editingTab.title,
                    favicon: editingTab.favicon,
                    url: editingTab.url,
                    category: editingTab.category,
                };

                // Save to Firestore
                try {
                    const docRef = await addDoc(
                        collection(db, 'savedTabs'),
                        newTab
                    );
                    setSavedTabs((prev) => {
                        const updatedGroups = { ...prev };
                        if (!updatedGroups[editingTab.category]) {
                            updatedGroups[editingTab.category] = [];
                        }
                        updatedGroups[editingTab.category].push({
                            ...newTab,
                            id: docRef.id,
                        });
                        return updatedGroups;
                    });
                } catch (error) {
                    console.error('Error saving tab:', error);
                }
            } else {
                console.log('This tab is already saved in a category.');
            }
        }
        setEditingTab(null);
    };

    const handleSaveAllTabs = () => {
        // Filter out tabs that are already saved in any category
        const unsavedTabs = tabs.filter((tab) => {
            return !Object.values(savedTabs).some((categoryTabs) =>
                categoryTabs.some((savedTab) => savedTab.url === tab.url)
            );
        });

        // If there are any unsaved tabs, add them to the "Uncategorized" category
        if (unsavedTabs.length > 0) {
            // setSavedTabs((prev) => {
            //     const updatedGroups = { ...prev };
            //     if (!updatedGroups['Uncategorized']) {
            //         updatedGroups['Uncategorized'] = [];
            //     }
            //     updatedGroups['Uncategorized'].push(...unsavedTabs);
            //     return updatedGroups;
            // });

            // Save to Firebase for persistence
            unsavedTabs.forEach((tab) => {
                saveTabToFirebase(tab, 'Uncategorized');
            });
        } else {
            console.log('All tabs are already saved.');
        }
    };

    // Function to save a tab to Firebase
    const saveTabToFirebase = async (tab, category) => {
        try {
            const docRef = await addDoc(collection(db, 'savedTabs'), {
                ...tab,
                category,
            });
            console.log('Document written with ID: ', docRef.id);
        } catch (e) {
            console.error('Error adding document: ', e);
        }
    };

    const handleDeleteTab = async (tabId, category) => {
        // Delete from Firestore
        try {
            await deleteDoc(doc(db, 'savedTabs', tabId));
            // Update local state
            setSavedTabs((prev) => {
                const updatedGroups = { ...prev };
                updatedGroups[category] = updatedGroups[category].filter(
                    (tab) => tab.id !== tabId
                );
                if (updatedGroups[category].length === 0) {
                    delete updatedGroups[category];
                }
                return updatedGroups;
            });
        } catch (error) {
            console.error('Error deleting tab:', error);
        }
    };

    const handleClearGroup = async (category) => {
        try {
            // Query all tabs in the selected category
            const q = query(
                collection(db, 'savedTabs'),
                where('category', '==', category)
            );
            const querySnapshot = await getDocs(q);

            // Delete each document found
            const batch = db.batch();
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Commit the batch delete operation
            await batch.commit();

            // Update the local state
            setSavedTabs((prev) => {
                const updatedGroups = { ...prev };
                delete updatedGroups[category];
                return updatedGroups;
            });

            console.log(
                `All tabs in the "${category}" group have been cleared.`
            );
        } catch (error) {
            console.error('Error clearing tabs: ', error);
        }
    };

    const toggleCategoryVisibility = (category) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const toggleDarkMode = () => {
        setDarkMode(!isDarkMode);
    };

    const handleNavigateToUrl = (url) => {
        window.open(url, '_blank'); // Open the URL in a new tab
    };

    return (
        <div className='w-[350px] h-auto bg-gray-100 text-gray-900 rounded-lg shadow-lg flex flex-col'>
            <div className='p-4 border-b border-gray-200'>
                <h1 className='text-2xl font-bold mb-2 text-orange-600'>
                    Tab Manager
                </h1>
            </div>
            <Tabs.Root defaultValue='open' className='flex-1 flex flex-col'>
                <Tabs.List className='grid w-full grid-cols-2 bg-gray-200'>
                    <Tabs.Trigger
                        value='open'
                        className='p-2 data-[state=active]:bg-white data-[state=active]:text-orange-600'
                    >
                        Open Tabs
                    </Tabs.Trigger>
                    <Tabs.Trigger
                        value='saved'
                        className='p-2 data-[state=active]:bg-white data-[state=active]:text-orange-600'
                    >
                        Saved Groups
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value='open' className='flex-1 flex flex-col'>
                    <div className='flex-1 overflow-y-auto max-h-[230px]'>
                        <ul className='space-y-2 p-4'>
                            {tabs.map((tab) => (
                                <li
                                    key={tab.id}
                                    className='flex items-center justify-between bg-white p-2 rounded-md hover:bg-gray-50 transition-colors'
                                >
                                    {editingTab && editingTab.id === tab.id ? (
                                        <div className='flex-1 flex flex-col items-center space-x-2'>
                                            <div className='tab-details'>
                                                <input
                                                    value={editingTab.title}
                                                    onChange={(e) =>
                                                        setEditingTab({
                                                            ...editingTab,
                                                            title: e.target
                                                                .value,
                                                        })
                                                    }
                                                    className='flex-1 p-1 border border-gray-300 rounded'
                                                />
                                                <Select.Root
                                                    value={editingTab.category}
                                                    onValueChange={(value) =>
                                                        setEditingTab({
                                                            ...editingTab,
                                                            category: value,
                                                        })
                                                    }
                                                >
                                                    <Select.Trigger className='w-[120px] p-1 border border-gray-300 rounded'>
                                                        <Select.Value placeholder='Category' />
                                                    </Select.Trigger>
                                                    <Select.Portal>
                                                        <Select.Content className='bg-white rounded shadow-md'>
                                                            <Select.Viewport>
                                                                <Select.Item
                                                                    value='Productivity'
                                                                    className='p-2 hover:bg-gray-100'
                                                                >
                                                                    <Select.ItemText>
                                                                        Productivity
                                                                    </Select.ItemText>
                                                                </Select.Item>
                                                                <Select.Item
                                                                    value='Personal'
                                                                    className='p-2 hover:bg-gray-100'
                                                                >
                                                                    <Select.ItemText>
                                                                        Personal
                                                                    </Select.ItemText>
                                                                </Select.Item>
                                                                <Select.Item
                                                                    value='Research'
                                                                    className='p-2 hover:bg-gray-100'
                                                                >
                                                                    <Select.ItemText>
                                                                        Research
                                                                    </Select.ItemText>
                                                                </Select.Item>
                                                                <Select.Item
                                                                    value='Uncategorized'
                                                                    className='p-2 hover:bg-gray-100'
                                                                >
                                                                    <Select.ItemText>
                                                                        Uncategorized
                                                                    </Select.ItemText>
                                                                </Select.Item>
                                                            </Select.Viewport>
                                                        </Select.Content>
                                                    </Select.Portal>
                                                </Select.Root>
                                            </div>
                                            <div className='flex justify-start items-center gap-2 mt-2 w-full'>
                                                <button
                                                    onClick={
                                                        handleSaveToCategory
                                                    }
                                                    className='py-1 px-3 bg-green-500 hover:bg-green-600 text-white rounded'
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setEditingTab(null)
                                                    }
                                                    className='py-1 px-3 bg-red-500 hover:bg-red-600 text-white rounded'
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className='flex items-center space-x-2 flex-1 min-w-0'>
                                                <img
                                                    src={tab.favicon}
                                                    alt='Tab favicon'
                                                    className='w-4 h-4 flex-shrink-0'
                                                />
                                                <span className='text-sm truncate'>
                                                    {tab.title}
                                                </span>
                                            </div>
                                            <div className='flex items-center space-x-1'>
                                                <button
                                                    onClick={() =>
                                                        handleEditTab(tab)
                                                    }
                                                    className='p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded'
                                                >
                                                    <Save className='h-4 w-4' />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className='p-4 border-t border-gray-200 flex space-x-2'>
                        <button
                            onClick={handleCaptureCurrentTab}
                            className='flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded flex items-center justify-center p-2'
                        >
                            <Plus className='mr-2 h-4 w-4' /> Save Current Tab
                        </button>
                        <button
                            onClick={handleSaveAllTabs}
                            className='flex-1 bg-white text-orange-600 text-sm outline outline-1 hover:bg-orange-500 hover:text-white rounded flex items-center justify-center p-2'
                        >
                            <Save className='mr-2 h-4 w-4' /> Save All Tabs
                        </button>
                    </div>
                </Tabs.Content>
                <Tabs.Content value='saved' className='flex-1 flex flex-col'>
                    <div className='p-4 border-b border-gray-200'>
                        {/* <input
                            type='text'
                            placeholder='Search tabs...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full p-2 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-orange-500 rounded'
                        /> */}
                    </div>

                    <div className='flex-1 overflow-auto'>
                        <div className='p-4 space-y-4'>
                            {Object.entries(savedTabs).map(
                                ([category, tabs]) => (
                                    <div key={category}>
                                        <button
                                            onClick={() =>
                                                toggleCategoryVisibility(
                                                    category
                                                )
                                            }
                                            className='w-full p-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-900 rounded flex justify-between items-center'
                                        >
                                            <div className='flex justify-start items-center'>
                                                <Folder className='mr-2 h-4 w-4 text-orange-500' />
                                                {category} ({tabs.length} tab
                                                {tabs.length > 1 && 's'})
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleClearGroup(category);
                                                }}
                                                className='p-1 text-gray-400 hover:text-gray-600 rounded'
                                            >
                                                <X className='h-4 w-4' />
                                            </button>
                                        </button>
                                        {expandedCategories[category] && (
                                            <ul className='pl-4 mt-2 space-y-1'>
                                                {tabs.map((tab) => (
                                                    <li
                                                        key={tab.id}
                                                        onClick={() =>
                                                            handleNavigateToUrl(
                                                                tab.url
                                                            )
                                                        }
                                                        className='flex items-center justify-between p-1 rounded-md bg-gray-100 cursor-pointer hover:bg-gray-200'
                                                    >
                                                        <div className='flex items-center space-x-2 flex-1 min-w-0'>
                                                            <img
                                                                src={
                                                                    tab.favicon
                                                                }
                                                                alt='Tab Icon'
                                                                className='w-4 h-4 flex-shrink-0'
                                                            />
                                                            <span className='text-sm truncate'>
                                                                {tab.title}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteTab(
                                                                    tab.id,
                                                                    category
                                                                );
                                                            }}
                                                            className='p-1 text-gray-400 hover:text-gray-600 rounded'
                                                        >
                                                            <X className='h-4 w-4' />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </Tabs.Content>
            </Tabs.Root>
            <div className='flex flex-col gap-2 p-4 border-t border-gray-200 space-y-2'>
                <div className='space-y-2'>
                    <input
                        type='url'
                        placeholder='Enter URL to capture'
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className='w-full p-2 bg-white text-gray-900 text-sm placeholder-gray-400 border border-gray-300 focus:outline-orange-500 rounded'
                    />
                    <div className='flex space-x-2'>
                        <Select.Root
                            value={category}
                            onValueChange={setCategory}
                        >
                            <Select.Trigger className='flex-1  border border-gray-300 rounded'>
                                <Select.Value placeholder='Category' />
                            </Select.Trigger>
                            <Select.Portal>
                                <Select.Content className='bg-white rounded shadow-md'>
                                    <Select.Viewport>
                                        <Select.Item
                                            value='Productivity'
                                            className='p-2 hover:bg-gray-100'
                                        >
                                            <Select.ItemText>
                                                Productivity
                                            </Select.ItemText>
                                        </Select.Item>
                                        <Select.Item
                                            value='Personal'
                                            className='p-2 hover:bg-gray-100'
                                        >
                                            <Select.ItemText>
                                                Personal
                                            </Select.ItemText>
                                        </Select.Item>
                                        <Select.Item
                                            value='Research'
                                            className='p-2 hover:bg-gray-100'
                                        >
                                            <Select.ItemText>
                                                Research
                                            </Select.ItemText>
                                        </Select.Item>
                                        <Select.Item
                                            value='Uncategorized'
                                            className='p-2 hover:bg-gray-100'
                                        >
                                            <Select.ItemText>
                                                Uncategorized
                                            </Select.ItemText>
                                        </Select.Item>
                                    </Select.Viewport>
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>
                        <button
                            onClick={handleCaptureUrl}
                            className='p-2 bg-orange-500 hover:bg-orange-600 text-white rounded'
                        >
                            <Link className='h-4 w-4' />
                        </button>
                    </div>
                </div>
                <div className='flex justify-between items-center'>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button
                                className='IconButton'
                                aria-label='Customise options'
                            >
                                <Settings className='h-4 w-4 focus:border-none ' />
                            </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                            <DropdownMenu.Content
                                className='DropdownMenuContent bg-white shadow-md rounded-md px-2'
                                sideOffset={10}
                                align='start'
                            >
                                <DropdownMenu.Label className='DropdownMenuLabel text-sm font-bold py-2'>
                                    Settings
                                </DropdownMenu.Label>
                                <DropdownMenu.Separator className='DropdownMenuSeparator' />
                                <DropdownMenu.Item className='DropdownMenuItem text-sm flex items-center justify-between cursor-pointer py-2'>
                                    <span className='flex items-center'>
                                        {isDarkMode ? (
                                            <Moon className='mr-2 h-4 w-4' />
                                        ) : (
                                            <Sun className='mr-2 h-4 w-4' />
                                        )}
                                        {isDarkMode ? 'Dark' : 'Light'} Mode
                                    </span>
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                    <span className='text-sm text-gray-500'>
                        {tabs.length} tabs open
                    </span>
                </div>
            </div>
        </div>
    );
}
