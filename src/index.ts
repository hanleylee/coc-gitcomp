import { commands, CompleteResult, VimCompleteItem, ExtensionContext, listManager, sources, window, workspace } from 'coc.nvim';
import DemoList from './lists';


export async function activate(context: ExtensionContext): Promise<void> {

    context.subscriptions.push(
        commands.registerCommand('coc-gitcomp.Command', async () => {
            window.showMessage(`coc-gitcomp Commands works!`);
        }),

        listManager.registerList(new DemoList(workspace.nvim)),

        sources.createSource({
            name: 'coc-gitcomp completion source', // unique id
            doComplete: async (opt) => {
                // console.log(opt.filepath)
                // console.log(workspace.workspaceFolder)
                // console.log(workspace.root)
                // console.log("getCompleteItems");
                // const items = await getCompletionItems();
                const items = executeShell(`git -C ${workspace.root} branch`)
                    .then(content => generateBranches(content))
                    .then(branches => getCompletionItems(branches))
                return items;
            },
        }),

        workspace.registerKeymap(
            ['n'],
            'gitcomp-keymap',
            async () => {
                window.showMessage(`registerKeymap`);
            },
            { sync: false }
        ),

        workspace.registerAutocmd({
            event: 'InsertLeave',
            request: true,
            callback: () => {
                window.showMessage(`registerAutocmd on InsertLeave`);
            },
        })
    );
}

async function getCompletionItems(branches: string[]): Promise<CompleteResult> {

    const completeItems: VimCompleteItem[] = new Array();
    for (var branch of branches) {
        let item: VimCompleteItem = { word: branch, menu: '[coc-gitcomp]' };
        completeItems.push(item);
    }

    var completeRes: CompleteResult = { items: completeItems };
    return completeRes;
}

async function generateBranches(content: string): Promise<string[]> {
    const branches: Array<string> = new Array()
    for (let l of content.split('\n')) {
        let l1 = l.replace(/\s/g, '');
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
