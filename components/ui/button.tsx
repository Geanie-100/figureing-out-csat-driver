export function Card({children}){return <div className="border rounded-xl p-2">{children}</div>}
export function CardContent({children}){return <div>{children}</div>}
export function Button({children,...props}){return <button {...props} className="px-2 py-1 bg-gray-200 rounded">{children}</button>}
export function Input(props){return <input {...props} className="border rounded p-1 w-full"/>}
export function Label({children}){return <label className="block text-sm font-medium">{children}</label>}
export function Tabs({children}){return <div>{children}</div>}
export function TabsList({children}){return <div className="flex gap-2">{children}</div>}
export function TabsTrigger({children, ...props}){return <button {...props} className="px-2 py-1 bg-gray-100 rounded">{children}</button>}
export function TabsContent({children, ...props}){return <div {...props}>{children}</div>}
export function Alert({children}){return <div className="bg-red-100 p-2 rounded">{children}</div>}
export function AlertTitle({children}){return <div className="font-bold">{children}</div>}
export function AlertDescription({children}){return <div>{children}</div>}
