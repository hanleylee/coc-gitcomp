import { commands, CompleteResult, VimCompleteItem, ExtensionContext, listManager, sources, window, workspace } from 'coc.nvim';
import DemoList from './lists';
import fs from 'fs';

const completeItemsMap: Map<string, CompleteResult> = new Map()

export async function activate(context: ExtensionContext): Promise<void> {
    let commandRegenerateBranches = commands.registerCommand('gitcomp.regenerateBranches', async () => {
        let git_dir = workspace.root + '/.git';
        const items = await createCompletionItems();
        completeItemsMap.set(git_dir, items);
    })
    let listDemo = listManager.registerList(new DemoList(workspace.nvim))
    let completeSource = sources.createSource({
        name: 'coc-gitcomp completion source', // unique id
        doComplete: async (opt) => {
            let git_dir = workspace.root + '/.git';
            if (fs.existsSync(git_dir)) {
                if (completeItemsMap.has(git_dir)) {
                    let completeItems = completeItemsMap.get(git_dir)
                    return completeItems
                } else {
                    const items = await createCompletionItems();
                    completeItemsMap.set(git_dir, items);
                    return items;
                }
            } else {
                // return Promise.resolve({ items: [] });
                return { items: [] };
            }
        },
    })
    let keyMap = workspace.registerKeymap(
        ['n'],
        'gitcomp-keymap',
        async () => {
            window.showMessage(`registerKeymap`);
        },
        { sync: false }
    )
    let autoCommand = workspace.registerAutocmd({
        event: 'InsertLeave',
        request: true,
        callback: () => {
            window.showMessage(`registerAutocmd on InsertLeave`);
        },
    })
    context.subscriptions.push(
        commandRegenerateBranches,
        listDemo,
        completeSource,
        keyMap,
        autoCommand,
    );
}

async function createCompletionItems(): Promise<CompleteResult> {
    return executeShell(`git -C ${workspace.root} branch`)
        .then((content) => generateBranches(content))
        .then((branches) => generateCompletionItems(branches));
}

async function generateCompletionItems(branches: string[]): Promise<CompleteResult> {
    const completeItems: VimCompleteItem[] = new Array();
    for (var branch of branches) {
        let item: VimCompleteItem = { word: branch, menu: '[coc-gitcomp]' };
        completeItems.push(item);
    }

    var completeRes: CompleteResult = { items: completeItems };
    return completeRes;
}

async function generateBranches(content: string): Promise<string[]> {
    const branches: Array<string> = new Array();
    for (let l0 of content.split('\n')) {
        let l1 = l0.replace(/\s/g, '');
        let l2 = l1.replace(/\*/g, '');
        if (l2.length != 0) {
            branches.push(l2);
        }
    }
    return branches;
}

async function executeShell(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        var exec = require('child_process').exec;
        exec(cmd, (err: string, stdout: string, stderr: string) => {
            if (err) {
                reject(err);
            } else {
                resolve(stdout);
            }
        });
    });
}
